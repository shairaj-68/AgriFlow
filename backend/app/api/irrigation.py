from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.farm import Farm
from app.models.farm_zone import FarmZone
from app.models.irrigation_record import IrrigationRecord
from app.schemas.irrigation import (
    FarmIrrigationOverview,
    IrrigationRecommendationResponse,
    ApplyIrrigationRequest,
    IrrigationLogItem
)
from app.services.irrigation_service import (
    get_farm_irrigation_overview,
    evaluate_zone_irrigation,
    log_applied_irrigation
)
from app.services.weather_service import fetch_weather_data
from app.api.deps import get_current_user

router = APIRouter(tags=["Irrigation Decision Engine"])

@router.get("/farms/{farm_id}/irrigation/recommendations", response_model=FarmIrrigationOverview)
async def get_irrigation_recommendations(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    overview = await get_farm_irrigation_overview(db, farm)
    return overview

@router.get("/zones/{zone_id}/irrigation/recommendation", response_model=IrrigationRecommendationResponse)
async def get_zone_irrigation_recommendation(
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

    weather_data = await fetch_weather_data(zone.farm.latitude, zone.farm.longitude)
    decision = evaluate_zone_irrigation(db, zone, weather_data)
    return decision

@router.post("/zones/{zone_id}/irrigation/apply")
def apply_zone_irrigation(
    zone_id: int,
    request: ApplyIrrigationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    zone = db.query(FarmZone).join(Farm).filter(
        FarmZone.id == zone_id,
        Farm.user_id == current_user.id
    ).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    record = log_applied_irrigation(
        db=db,
        zone=zone,
        applied_depth_mm=request.applied_depth_mm,
        applied_volume_liters=request.applied_volume_liters,
        duration_minutes=request.duration_minutes,
        notes=request.notes
    )

    return {
        "success": True,
        "message": f"Applied {record.applied_depth_mm} mm ({record.applied_volume_liters:,.0f} L) of irrigation to {zone.name}",
        "new_soil_water_mm": zone.current_soil_water_mm,
        "pump_duration_minutes": record.duration_minutes
    }

@router.get("/farms/{farm_id}/irrigation/history", response_model=List[IrrigationLogItem])
def get_irrigation_history(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    zone_ids = [z.id for z in farm.zones]
    records = db.query(IrrigationRecord).filter(
        IrrigationRecord.zone_id.in_(zone_ids)
    ).order_by(IrrigationRecord.applied_date.desc(), IrrigationRecord.id.desc()).limit(50).all() if zone_ids else []

    results = []
    for r in records:
        results.append({
            "id": r.id,
            "zone_id": r.zone_id,
            "zone_name": r.zone.name if r.zone else "Zone",
            "applied_date": r.applied_date.isoformat(),
            "applied_depth_mm": r.applied_depth_mm,
            "applied_volume_liters": r.applied_volume_liters,
            "duration_minutes": r.duration_minutes,
            "method": r.method,
            "source": r.source,
            "notes": r.notes,
            "created_at": r.created_at
        })
    return results
