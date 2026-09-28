from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.farm import Farm
from app.schemas.weather import WeatherOverviewResponse
from app.services.weather_service import fetch_weather_data
from app.api.deps import get_current_user

router = APIRouter(prefix="/farms", tags=["Weather"])

@router.get("/{farm_id}/weather", response_model=WeatherOverviewResponse)
async def get_farm_weather(
    farm_id: int,
    refresh: bool = Query(False, description="Force refresh cache"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    weather_data = await fetch_weather_data(farm.latitude, farm.longitude, force_refresh=refresh)
    
    return {
        "farm_id": farm.id,
        "latitude": farm.latitude,
        "longitude": farm.longitude,
        "timezone": weather_data.get("timezone", "UTC"),
        "current": weather_data.get("current"),
        "forecast_7d": weather_data.get("forecast_7d", []),
        "cached": weather_data.get("cached", False),
        "last_updated": weather_data.get("last_updated")
    }

@router.get("/{farm_id}/forecast")
async def get_farm_forecast(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    weather_data = await fetch_weather_data(farm.latitude, farm.longitude)
    return {
        "farm_id": farm.id,
        "forecast_7d": weather_data.get("forecast_7d", []),
        "last_updated": weather_data.get("last_updated")
    }
