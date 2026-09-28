from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.farm import Farm
from app.models.farm_zone import FarmZone
from app.models.crop import Crop
from app.schemas.zone import FarmZoneCreate, FarmZoneUpdate, FarmZoneResponse
from app.api.deps import get_current_user
from app.api.farms import compute_area_m2

router = APIRouter(tags=["Farm Zones"])

@router.get("/farms/{farm_id}/zones", response_model=List[FarmZoneResponse])
def get_farm_zones(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    return farm.zones

@router.post("/farms/{farm_id}/zones", response_model=FarmZoneResponse, status_code=status.HTTP_201_CREATED)
def create_farm_zone(
    farm_id: int,
    zone_in: FarmZoneCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    crop = db.query(Crop).filter(Crop.id == zone_in.crop_id).first()
    if not crop:
        raise HTTPException(status_code=400, detail="Crop not found")

    area_m2 = compute_area_m2(zone_in.area, zone_in.area_unit)
    
    zone = FarmZone(
        farm_id=farm.id,
        crop_id=crop.id,
        name=zone_in.name,
        growth_stage=zone_in.growth_stage,
        area=zone_in.area,
        area_unit=zone_in.area_unit,
        area_m2=area_m2,
        soil_type=zone_in.soil_type,
        root_zone_depth_cm=zone_in.root_zone_depth_cm,
        field_capacity_mm=zone_in.field_capacity_mm,
        wilting_point_mm=zone_in.wilting_point_mm,
        current_soil_water_mm=zone_in.current_soil_water_mm,
        target_soil_water_mm=zone_in.target_soil_water_mm,
        irrigation_method=zone_in.irrigation_method,
        pump_flow_rate_lpm=zone_in.pump_flow_rate_lpm,
        irrigation_efficiency=zone_in.irrigation_efficiency,
        polygon_json=zone_in.polygon_json
    )
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return zone

@router.get("/zones/{zone_id}", response_model=FarmZoneResponse)
def get_zone(
    zone_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    zone = db.query(FarmZone).join(Farm).filter(
        FarmZone.id == zone_id,
        Farm.user_id == current_user.id
    ).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    return zone

@router.put("/zones/{zone_id}", response_model=FarmZoneResponse)
def update_zone(
    zone_id: int,
    zone_in: FarmZoneUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    zone = db.query(FarmZone).join(Farm).filter(
        FarmZone.id == zone_id,
        Farm.user_id == current_user.id
    ).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    update_data = zone_in.dict(exclude_unset=True)
    if "area" in update_data or "area_unit" in update_data:
        area_val = update_data.get("area", zone.area)
        unit_val = update_data.get("area_unit", zone.area_unit)
        update_data["area_m2"] = compute_area_m2(area_val, unit_val)

    for field, val in update_data.items():
        setattr(zone, field, val)

    db.commit()
    db.refresh(zone)
    return zone

@router.delete("/zones/{zone_id}")
def delete_zone(
    zone_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    zone = db.query(FarmZone).join(Farm).filter(
        FarmZone.id == zone_id,
        Farm.user_id == current_user.id
    ).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    
    db.delete(zone)
    db.commit()
    return {"success": True, "message": f"Zone '{zone.name}' deleted"}
