from datetime import date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.farm import Farm
from app.models.farm_zone import FarmZone
from app.models.soil_water_record import SoilWaterRecord
from app.schemas.soil import SoilStatus, SoilSeriesPoint, WaterBalanceBreakdown
from app.services.soil_water_service import compute_zone_thresholds
from app.services.sensor_provider import get_soil_data_provider
from app.api.deps import get_current_user

router = APIRouter(tags=["Soil & Water Balance"])

def build_soil_status(db: Session, zone: FarmZone) -> SoilStatus:
    provider = get_soil_data_provider("SIMULATED")
    moisture_pct = provider.get_soil_moisture_pct(db, zone)
    current_water = provider.get_soil_water_mm(db, zone)
    
    thresholds = compute_zone_thresholds(zone)
    taw = thresholds["taw_mm"]
    raw = thresholds["raw_mm"]
    stress_threshold = thresholds["stress_threshold_mm"]
    
    # Relative available water (0% at WP, 100% at FC)
    rel_avail = max(0.0, min(100.0, ((current_water - zone.wilting_point_mm) / taw) * 100.0))

    if current_water <= stress_threshold:
        status_label = "STRESS"
    elif current_water < (zone.target_soil_water_mm - 5.0):
        status_label = "MODERATE"
    elif current_water > zone.field_capacity_mm:
        status_label = "WATERLOGGED"
    else:
        status_label = "OPTIMAL"

    # Latest day balance record
    latest_rec = db.query(SoilWaterRecord).filter(
        SoilWaterRecord.zone_id == zone.id
    ).order_by(SoilWaterRecord.record_date.desc()).first()

    if latest_rec:
        wb = WaterBalanceBreakdown(
            previous_water_mm=latest_rec.previous_water_mm,
            rainfall_mm=latest_rec.rainfall_mm,
            irrigation_mm=latest_rec.irrigation_mm,
            etc_mm=latest_rec.etc_mm,
            runoff_mm=latest_rec.runoff_mm,
            drainage_mm=latest_rec.drainage_mm,
            remaining_water_mm=latest_rec.remaining_water_mm
        )
    else:
        wb = WaterBalanceBreakdown(
            previous_water_mm=current_water,
            rainfall_mm=0.0,
            irrigation_mm=0.0,
            etc_mm=4.8,
            runoff_mm=0.0,
            drainage_mm=0.0,
            remaining_water_mm=current_water
        )

    return SoilStatus(
        zone_id=zone.id,
        zone_name=zone.name,
        crop_name=zone.crop.name if zone.crop else "Tomato",
        growth_stage=zone.growth_stage,
        current_soil_water_mm=current_water,
        target_soil_water_mm=zone.target_soil_water_mm,
        field_capacity_mm=zone.field_capacity_mm,
        wilting_point_mm=zone.wilting_point_mm,
        stress_threshold_mm=stress_threshold,
        total_available_water_mm=taw,
        readily_available_water_mm=raw,
        volumetric_moisture_pct=moisture_pct,
        relative_available_water_pct=round(rel_avail, 1),
        status=status_label,
        is_simulated=True,
        provenance=provider.get_provenance_badge(),
        water_balance_today=wb
    )

@router.get("/farms/{farm_id}/soil", response_model=List[SoilStatus])
def get_farm_soil_overview(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    return [build_soil_status(db, zone) for zone in farm.zones]

@router.get("/zones/{zone_id}/soil", response_model=SoilStatus)
def get_zone_soil_status(
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

    return build_soil_status(db, zone)

@router.get("/zones/{zone_id}/water-balance")
def get_zone_water_balance(
    zone_id: int,
    days: int = 14,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    zone = db.query(FarmZone).join(Farm).filter(
        FarmZone.id == zone_id,
        Farm.user_id == current_user.id
    ).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    start_date = date.today() - timedelta(days=days)
    records = db.query(SoilWaterRecord).filter(
        SoilWaterRecord.zone_id == zone.id,
        SoilWaterRecord.record_date >= start_date
    ).order_by(SoilWaterRecord.record_date.asc()).all()

    thresholds = compute_zone_thresholds(zone)

    series = []
    for r in records:
        series.append({
            "date": r.record_date.isoformat(),
            "soil_water_mm": r.remaining_water_mm,
            "soil_moisture_pct": r.soil_moisture_pct,
            "rainfall_mm": r.rainfall_mm,
            "irrigation_mm": r.irrigation_mm,
            "etc_mm": r.etc_mm,
            "field_capacity_mm": zone.field_capacity_mm,
            "wilting_point_mm": zone.wilting_point_mm,
            "stress_threshold_mm": thresholds["stress_threshold_mm"]
        })

    status_obj = build_soil_status(db, zone)

    return {
        "zone_id": zone.id,
        "zone_name": zone.name,
        "current_status": status_obj,
        "series": series,
        "provenance": "SIMULATED"
    }
