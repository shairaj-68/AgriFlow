from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.farm import Farm
from app.schemas.farm import FarmCreate, FarmUpdate, FarmResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/farms", tags=["Farms"])

def compute_area_m2(area: float, unit: str) -> float:
    unit_lower = unit.lower()
    if "acre" in unit_lower:
        return round(area * 4046.86, 2)
    elif "hectare" in unit_lower or "ha" in unit_lower:
        return round(area * 10000.0, 2)
    return round(area, 2)

@router.get("", response_model=List[FarmResponse])
def get_farms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    farms = db.query(Farm).filter(Farm.user_id == current_user.id).all()
    return farms

@router.post("", response_model=FarmResponse, status_code=status.HTTP_201_CREATED)
def create_farm(
    farm_in: FarmCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    area_m2 = compute_area_m2(farm_in.area, farm_in.area_unit)
    
    # Efficiency defaults if not explicitly custom
    eff = farm_in.irrigation_efficiency
    if eff is None or eff <= 0:
        method_l = farm_in.irrigation_method.lower()
        eff = 0.90 if "drip" in method_l else (0.75 if "sprinkler" in method_l else 0.60)

    farm = Farm(
        user_id=current_user.id,
        name=farm_in.name,
        location_name=farm_in.location_name,
        latitude=farm_in.latitude,
        longitude=farm_in.longitude,
        area=farm_in.area,
        area_unit=farm_in.area_unit,
        area_m2=area_m2,
        soil_type=farm_in.soil_type,
        root_zone_depth_cm=farm_in.root_zone_depth_cm,
        irrigation_method=farm_in.irrigation_method,
        pump_flow_rate_lpm=farm_in.pump_flow_rate_lpm,
        irrigation_efficiency=eff,
        is_active=farm_in.is_active
    )
    db.add(farm)
    db.commit()
    db.refresh(farm)
    return farm

@router.get("/{farm_id}", response_model=FarmResponse)
def get_farm(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    return farm

@router.put("/{farm_id}", response_model=FarmResponse)
def update_farm(
    farm_id: int,
    farm_in: FarmUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    update_data = farm_in.dict(exclude_unset=True)
    if "area" in update_data or "area_unit" in update_data:
        area_val = update_data.get("area", farm.area)
        unit_val = update_data.get("area_unit", farm.area_unit)
        update_data["area_m2"] = compute_area_m2(area_val, unit_val)

    for field, val in update_data.items():
        setattr(farm, field, val)

    db.commit()
    db.refresh(farm)
    return farm

@router.delete("/{farm_id}")
def delete_farm(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    
    db.delete(farm)
    db.commit()
    return {"success": True, "message": f"Farm '{farm.name}' deleted successfully"}
