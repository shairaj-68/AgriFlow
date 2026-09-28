from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.farm import Farm
from app.models.farm_zone import FarmZone
from app.schemas.soil import SoilSimulationRequest, SoilSimulationResponse
from app.services.soil_water_service import run_multi_day_simulation
from app.api.deps import get_current_user

router = APIRouter(tags=["Simulation Engine"])

@router.post("/zones/{zone_id}/simulate", response_model=SoilSimulationResponse)
async def simulate_zone(
    zone_id: int,
    request: SoilSimulationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    zone = db.query(FarmZone).join(Farm).filter(
        FarmZone.id == zone_id,
        Farm.user_id == current_user.id
    ).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    start_water, end_water, end_moisture, count = await run_multi_day_simulation(
        db=db,
        zone=zone,
        days=request.days,
        scenario=request.scenario,
        custom_rainfall_mm=request.custom_rainfall_mm,
        custom_irrigation_mm=request.custom_irrigation_mm
    )

    msg = f"Simulated {request.days} day(s). Soil water changed from {start_water} mm to {end_water} mm ({end_moisture}% volumetric moisture)."

    return SoilSimulationResponse(
        zone_id=zone.id,
        days_simulated=request.days,
        starting_water_mm=start_water,
        ending_water_mm=end_water,
        ending_moisture_pct=end_moisture,
        records_created=count,
        message=msg
    )

@router.post("/farms/{farm_id}/simulate-scenario")
async def simulate_farm_scenario(
    farm_id: int,
    scenario: str = "DRY_SPELL",  # DRY_SPELL, HEAVY_RAIN, NEXT_DAY
    days: int = 1,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    results = []
    for zone in farm.zones:
        start_w, end_w, end_m, count = await run_multi_day_simulation(
            db=db,
            zone=zone,
            days=days,
            scenario=scenario
        )
        results.append({
            "zone_id": zone.id,
            "zone_name": zone.name,
            "starting_water_mm": start_w,
            "ending_water_mm": end_w,
            "ending_moisture_pct": end_m
        })

    return {
        "success": True,
        "scenario": scenario,
        "days": days,
        "zones_simulated": len(results),
        "results": results
    }
