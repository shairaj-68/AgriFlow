from datetime import datetime, date, timedelta, timezone
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.farm_zone import FarmZone
from app.models.soil_water_record import SoilWaterRecord
from app.services.et_service import calculate_fao56_penman_monteith, calculate_crop_et
from app.services.crop_service import get_crop_kc
from app.services.weather_service import fetch_weather_data
from app.services.sensor_provider import get_soil_data_provider

def compute_zone_thresholds(zone: FarmZone) -> Dict[str, float]:
    taw = max(1.0, zone.field_capacity_mm - zone.wilting_point_mm)
    p = zone.crop.critical_depletion_fraction if zone.crop else 0.50
    raw = p * taw
    stress_threshold = zone.wilting_point_mm + (1.0 - p) * taw
    
    return {
        "taw_mm": round(taw, 2),
        "raw_mm": round(raw, 2),
        "stress_threshold_mm": round(stress_threshold, 2),
        "critical_depletion_p": p
    }

def calculate_daily_water_balance(
    previous_water_mm: float,
    rainfall_mm: float,
    irrigation_mm: float,
    etc_mm: float,
    field_capacity_mm: float,
    wilting_point_mm: float
) -> Tuple[float, float, float]:
    """
    Computes daily water balance step:
    W_t = W_{t-1} + P + I - ETc - Runoff - Drainage
    Returns (remaining_water_mm, runoff_mm, drainage_mm)
    """
    # Effective rainfall (approx 85% effective if moderate, runoff if intense > 30mm)
    if rainfall_mm > 35.0:
        effective_rain = 30.0 + 0.5 * (rainfall_mm - 35.0)
        runoff_mm = rainfall_mm - effective_rain
    else:
        effective_rain = rainfall_mm * 0.95
        runoff_mm = rainfall_mm - effective_rain
    
    preliminary_storage = previous_water_mm + effective_rain + irrigation_mm - etc_mm
    
    # Deep drainage if water exceeds field capacity
    if preliminary_storage > field_capacity_mm:
        drainage_mm = preliminary_storage - field_capacity_mm
        remaining_water_mm = field_capacity_mm
    else:
        drainage_mm = 0.0
        # Prevent drop below physical wilting point
        remaining_water_mm = max(wilting_point_mm, preliminary_storage)
        
    return round(remaining_water_mm, 2), round(runoff_mm, 2), round(drainage_mm, 2)

async def simulate_zone_step(
    db: Session,
    zone: FarmZone,
    sim_date: date,
    custom_rainfall_mm: Optional[float] = None,
    custom_irrigation_mm: Optional[float] = None,
    custom_etc_mm: Optional[float] = None
) -> SoilWaterRecord:
    """
    Simulates a single 24-hour step for a given farm zone, updating its state in the database.
    """
    # 1. Fetch weather and calculate ETc if not provided
    if custom_etc_mm is None or custom_rainfall_mm is None:
        weather_data = await fetch_weather_data(zone.farm.latitude, zone.farm.longitude)
        curr = weather_data.get("current", {})
        temp_c = curr.get("temperature_c", 28.0)
        humidity_pct = curr.get("relative_humidity_pct", 55.0)
        wind_ms = curr.get("wind_speed_ms", 2.5)
        rad_wm2 = curr.get("solar_radiation_wm2", 350.0)
        
        et0, _ = calculate_fao56_penman_monteith(temp_c, humidity_pct, wind_ms, solar_radiation_wm2=rad_wm2)
        kc = get_crop_kc(zone.crop, zone.growth_stage) if zone.crop else 1.0
        etc_val = calculate_crop_et(et0, kc) if custom_etc_mm is None else custom_etc_mm
        rain_val = curr.get("rainfall_mm", 0.0) if custom_rainfall_mm is None else custom_rainfall_mm
    else:
        etc_val = custom_etc_mm
        rain_val = custom_rainfall_mm

    irrig_val = custom_irrigation_mm or 0.0
    prev_water = zone.current_soil_water_mm

    remaining_water, runoff, drainage = calculate_daily_water_balance(
        previous_water_mm=prev_water,
        rainfall_mm=rain_val,
        irrigation_mm=irrig_val,
        etc_mm=etc_val,
        field_capacity_mm=zone.field_capacity_mm,
        wilting_point_mm=zone.wilting_point_mm
    )

    # Update zone current state
    zone.current_soil_water_mm = remaining_water
    zone.updated_at = datetime.utcnow()

    # Calculate soil moisture %
    provider = get_soil_data_provider("SIMULATED")
    moisture_pct = provider.get_soil_moisture_pct(db, zone)

    # Save to history table
    record = SoilWaterRecord(
        zone_id=zone.id,
        record_date=sim_date,
        previous_water_mm=prev_water,
        rainfall_mm=rain_val,
        irrigation_mm=irrig_val,
        etc_mm=etc_val,
        runoff_mm=runoff,
        drainage_mm=drainage,
        remaining_water_mm=remaining_water,
        soil_moisture_pct=moisture_pct,
        is_simulated=True
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

async def run_multi_day_simulation(
    db: Session,
    zone: FarmZone,
    days: int = 1,
    scenario: Optional[str] = None,
    custom_rainfall_mm: Optional[float] = None,
    custom_irrigation_mm: Optional[float] = None
) -> Tuple[float, float, float, int]:
    """
    Steps simulation forward by N days (e.g. 1 day, 7 days, or a dry spell scenario).
    """
    start_water = zone.current_soil_water_mm
    today = date.today()
    
    # Check latest record date to ensure sequential days
    latest_record = db.query(SoilWaterRecord).filter(
        SoilWaterRecord.zone_id == zone.id
    ).order_by(SoilWaterRecord.record_date.desc()).first()

    base_date = latest_record.record_date if latest_record else (today - timedelta(days=1))
    
    # Weather forecast to guide daily ET and rain
    weather_data = await fetch_weather_data(zone.farm.latitude, zone.farm.longitude)
    forecast_7d = weather_data.get("forecast_7d", [])
    
    records_count = 0
    for i in range(1, days + 1):
        step_date = base_date + timedelta(days=i)
        
        # Determine ET and Rain based on scenario
        day_forecast = forecast_7d[(i - 1) % len(forecast_7d)] if forecast_7d else {}
        f_et0 = day_forecast.get("et0_forecast_mm", 5.0)
        kc = get_crop_kc(zone.crop, zone.growth_stage) if zone.crop else 1.15
        day_etc = calculate_crop_et(f_et0, kc)
        
        if scenario == "DRY_SPELL":
            day_rain = 0.0
            day_etc = round(day_etc * 1.25, 2)  # High heat/stress
        elif scenario == "HEAVY_RAIN":
            day_rain = 25.0 if i == 1 else 10.0
        else:
            day_rain = custom_rainfall_mm if custom_rainfall_mm is not None else day_forecast.get("rainfall_sum_mm", 0.0)
            
        day_irrig = custom_irrigation_mm if (custom_irrigation_mm is not None and i == 1) else 0.0

        await simulate_zone_step(
            db=db,
            zone=zone,
            sim_date=step_date,
            custom_rainfall_mm=day_rain,
            custom_irrigation_mm=day_irrig,
            custom_etc_mm=day_etc
        )
        records_count += 1

    end_water = zone.current_soil_water_mm
    provider = get_soil_data_provider("SIMULATED")
    end_moisture = provider.get_soil_moisture_pct(db, zone)

    return start_water, end_water, end_moisture, records_count
