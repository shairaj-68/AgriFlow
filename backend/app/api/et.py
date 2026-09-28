from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.farm import Farm
from app.models.crop import Crop
from app.schemas.et import ETCalculationRequest, ETCalculationResponse, ETOverviewResponse
from app.services.et_service import calculate_fao56_penman_monteith, calculate_crop_et
from app.services.crop_service import get_crop_kc
from app.services.weather_service import fetch_weather_data
from app.api.deps import get_current_user

router = APIRouter(tags=["Evapotranspiration"])

@router.get("/farms/{farm_id}/et", response_model=ETOverviewResponse)
async def get_farm_et_overview(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    weather_data = await fetch_weather_data(farm.latitude, farm.longitude)
    curr = weather_data.get("current", {})
    temp_c = curr.get("temperature_c", 28.0)
    humidity_pct = curr.get("relative_humidity_pct", 55.0)
    wind_ms = curr.get("wind_speed_ms", 2.5)
    rad_wm2 = curr.get("solar_radiation_wm2", 350.0)

    # First zone crop or default Tomato
    primary_zone = farm.zones[0] if farm.zones else None
    crop_name = primary_zone.crop.name if (primary_zone and primary_zone.crop) else "Tomato"
    growth_stage = primary_zone.growth_stage if primary_zone else "Flowering"
    
    crop = db.query(Crop).filter(Crop.name == crop_name).first()
    kc = get_crop_kc(crop, growth_stage) if crop else 1.15

    et0, _ = calculate_fao56_penman_monteith(temp_c, humidity_pct, wind_ms, solar_radiation_wm2=rad_wm2)
    etc = calculate_crop_et(et0, kc)

    # 7-day trend from forecast
    trend_7d = []
    forecast_7d = weather_data.get("forecast_7d", [])
    for f in forecast_7d:
        f_et0 = f.get("et0_forecast_mm", 4.8)
        f_etc = calculate_crop_et(f_et0, kc)
        t_mean = (f.get("temperature_max_c", 30.0) + f.get("temperature_min_c", 20.0)) / 2.0
        trend_7d.append({
            "date": f.get("date"),
            "et0_mm": f_et0,
            "etc_mm": f_etc,
            "kc": kc,
            "temp_c": round(t_mean, 1),
            "rainfall_mm": f.get("rainfall_sum_mm", 0.0)
        })

    return {
        "farm_id": farm.id,
        "current_et0_mm": et0,
        "current_etc_mm": etc,
        "current_kc": kc,
        "crop_name": crop_name,
        "growth_stage": growth_stage,
        "method": "FAO-56 Penman-Monteith",
        "trend_7d": trend_7d,
        "provenance": "CALCULATED"
    }

@router.post("/et/calculate", response_model=ETCalculationResponse)
def calculate_custom_et(request: ETCalculationRequest, db: Session = Depends(get_db)):
    et0, psychrometrics = calculate_fao56_penman_monteith(
        temp_c=request.temperature_c,
        humidity_pct=request.relative_humidity_pct,
        wind_speed_ms=request.wind_speed_ms,
        solar_radiation_wm2=request.solar_radiation_wm2,
        solar_radiation_mj_m2_day=request.solar_radiation_mj_m2_day
    )

    kc = request.custom_kc
    if kc is None:
        crop = db.query(Crop).filter(Crop.name == request.crop_name).first()
        kc = get_crop_kc(crop, request.growth_stage) if crop else 1.15

    etc = calculate_crop_et(et0, kc)

    explanation = {
        "evaporation": "Water vaporized directly from bare soil and wet plant surfaces driven by vapor pressure deficit (VPD).",
        "transpiration": "Water taken up by plant roots and transpired through stomata during photosynthesis.",
        "evapotranspiration": f"Total combined water loss ({etc} mm/day) determined by reference ET0 ({et0} mm) and crop coefficient Kc ({kc}).",
        "scientific_formula": "FAO-56 Penman-Monteith: ET0 = [0.408*Delta*(Rn - G) + gamma*(900/(T+273))*u2*(es - ea)] / [Delta + gamma*(1 + 0.34*u2)]"
    }

    return {
        "reference_et0_mm_day": et0,
        "crop_coefficient_kc": kc,
        "crop_etc_mm_day": etc,
        "calculation_method": "FAO-56 Penman-Monteith",
        "fallback_used": False,
        "provenance": "CALCULATED",
        "psychrometrics": psychrometrics,
        "explanation": explanation
    }
