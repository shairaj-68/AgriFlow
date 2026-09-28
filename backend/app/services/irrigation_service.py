import json
from datetime import datetime, date, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.farm_zone import FarmZone
from app.models.farm import Farm
from app.models.irrigation_record import IrrigationRecommendation, IrrigationRecord
from app.services.et_service import calculate_fao56_penman_monteith, calculate_crop_et
from app.services.crop_service import get_crop_kc
from app.services.weather_service import fetch_weather_data
from app.services.sensor_provider import get_soil_data_provider

def evaluate_zone_irrigation(
    db: Session,
    zone: FarmZone,
    weather_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Core Precision Irrigation Decision Engine.
    Evaluates:
      1. Water availability & depletion below stress threshold
      2. Daily crop evapotranspiration (ETc)
      3. Upcoming 24h-48h rainfall forecast
      4. Required water depth, volume (L), and pump runtime (min)
      5. Generates structured, explainable 'Why this decision?' rationale
    """
    farm = zone.farm
    crop = zone.crop
    
    # 1. Current Soil Water & Thresholds
    provider = get_soil_data_provider("SIMULATED")
    current_water_mm = provider.get_soil_water_mm(db, zone)
    moisture_pct = provider.get_soil_moisture_pct(db, zone)
    
    fc_mm = zone.field_capacity_mm
    wp_mm = zone.wilting_point_mm
    target_mm = zone.target_soil_water_mm
    taw_mm = max(1.0, fc_mm - wp_mm)
    
    p = crop.critical_depletion_fraction if crop else 0.50
    raw_mm = p * taw_mm
    stress_threshold_mm = wp_mm + (1.0 - p) * taw_mm
    
    # 2. Weather & ET
    curr_weather = weather_data.get("current", {})
    temp_c = curr_weather.get("temperature_c", 28.0)
    humidity_pct = curr_weather.get("relative_humidity_pct", 55.0)
    wind_ms = curr_weather.get("wind_speed_ms", 2.5)
    rad_wm2 = curr_weather.get("solar_radiation_wm2", 350.0)
    
    et0, _ = calculate_fao56_penman_monteith(temp_c, humidity_pct, wind_ms, solar_radiation_wm2=rad_wm2)
    kc = get_crop_kc(crop, zone.growth_stage) if crop else 1.15
    etc_mm = calculate_crop_et(et0, kc)
    
    # 3. Rain Forecast (Next 48 Hours)
    forecast_7d = weather_data.get("forecast_7d", [])
    rain_tomorrow = 0.0
    rain_prob_tomorrow = 0
    if len(forecast_7d) > 1:
        rain_tomorrow = forecast_7d[1].get("rainfall_sum_mm", 0.0)
        rain_prob_tomorrow = forecast_7d[1].get("precipitation_probability_pct", 0)
    elif len(forecast_7d) > 0:
        rain_tomorrow = forecast_7d[0].get("rainfall_sum_mm", 0.0)
        rain_prob_tomorrow = forecast_7d[0].get("precipitation_probability_pct", 0)

    # 4. Decision Tree Evaluation
    deficit_mm = max(0.0, target_mm - current_water_mm)
    efficiency = max(0.40, min(1.0, zone.irrigation_efficiency or 0.90))
    area_m2 = zone.area_m2 or (zone.area * 4046.86 if zone.area_unit.lower() == "acre" else zone.area * 10000.0)
    pump_flow_lpm = max(10.0, zone.pump_flow_rate_lpm or 300.0)

    reasons = []
    factors = []
    status = "NO_IRRIGATION_REQUIRED"
    status_display = "NO IRRIGATION REQUIRED"
    status_color = "green"
    recommended_irrigation_mm = 0.0
    gross_irrigation_mm = 0.0
    water_volume_liters = 0.0
    pump_duration_minutes = 0.0
    recommended_time = "06:00 AM"

    # Evaluate factors
    is_below_stress = current_water_mm <= stress_threshold_mm
    is_significant_rain = rain_tomorrow >= 7.0 and rain_prob_tomorrow >= 50

    if is_below_stress and is_significant_rain:
        # Postpone Irrigation due to imminent rainfall
        status = "IRRIGATION_POSTPONED"
        status_display = "IRRIGATION POSTPONED — RAIN EXPECTED"
        status_color = "blue"
        reasons.append(f"Significant rainfall ({rain_tomorrow} mm, {rain_prob_tomorrow}% chance) is forecast tomorrow.")
        reasons.append(f"Postponing irrigation preserves {round(deficit_mm * area_m2 / efficiency, 0):,.0f} L of pumped water.")
        reasons.append(f"Soil moisture ({moisture_pct}%) is monitored until rainfall occurrence.")
        
        factors = [
            {"title": "Soil Moisture Level", "status": "WARN", "description": f"Storage is {current_water_mm} mm (stress threshold {stress_threshold_mm} mm)."},
            {"title": "Rainfall Forecast", "status": "ALERT", "description": f"{rain_tomorrow} mm expected tomorrow ({rain_prob_tomorrow}% probability)."},
            {"title": "Crop Evapotranspiration", "status": "INFO", "description": f"Daily ETc is {etc_mm} mm/day ({zone.growth_stage} stage)."},
            {"title": "Decision Action", "status": "CHECK", "description": "Postpone irrigation to leverage natural precipitation."}
        ]
        summary_text = f"Soil water is low ({current_water_mm} mm), but {rain_tomorrow} mm rainfall is forecast tomorrow. Postponing irrigation will prevent over-saturation and save water."

    elif is_below_stress or (current_water_mm < target_mm and (current_water_mm - etc_mm) <= stress_threshold_mm):
        # Irrigation Required
        status = "IRRIGATION_REQUIRED"
        status_display = "IRRIGATION REQUIRED"
        status_color = "red"
        
        recommended_irrigation_mm = round(deficit_mm, 1)
        gross_irrigation_mm = round(recommended_irrigation_mm / efficiency, 1)
        
        # 1 mm over 1 m2 = 1 Liter
        water_volume_liters = round(gross_irrigation_mm * area_m2, 0)
        pump_duration_minutes = round(water_volume_liters / pump_flow_lpm, 1)
        
        reasons.append(f"Soil water storage ({current_water_mm} mm) is below the critical threshold ({stress_threshold_mm} mm).")
        reasons.append(f"Crop is in {zone.growth_stage} stage with high water sensitivity (Kc = {kc}).")
        reasons.append(f"Daily crop evapotranspiration loss (ETc) is {etc_mm} mm/day.")
        reasons.append(f"No significant rainfall expected ({rain_tomorrow} mm forecast).")
        reasons.append(f"Water deficit is {recommended_irrigation_mm} mm. Accounting for {int(efficiency*100)}% {zone.irrigation_method} efficiency, apply {gross_irrigation_mm} mm.")

        factors = [
            {"title": "Soil Moisture Depletion", "status": "ALERT", "description": f"Current water {current_water_mm} mm vs threshold {stress_threshold_mm} mm."},
            {"title": "Crop Growth Stage", "status": "INFO", "description": f"{crop.name if crop else 'Crop'} in {zone.growth_stage} (Kc = {kc})."},
            {"title": "Evapotranspiration Loss", "status": "WARN", "description": f"High daily ETc of {etc_mm} mm/day (ET0 = {et0} mm)."},
            {"title": "Rain Forecast", "status": "CHECK", "description": f"Negligible rain expected ({rain_tomorrow} mm)."},
            {"title": "Water Application", "status": "ALERT", "description": f"Apply {gross_irrigation_mm} mm ({water_volume_liters:,.0f} L) for {pump_duration_minutes} mins."}
        ]
        summary_text = f"Soil water is below the recommended threshold. Today's crop evapotranspiration is {etc_mm} mm and no significant rainfall is expected. Apply {gross_irrigation_mm} mm of irrigation to {zone.name} for approximately {int(pump_duration_minutes)} minutes."

    elif current_water_mm < (target_mm - 3.0):
        # Monitoring
        status = "MONITOR_SOIL"
        status_display = "IRRIGATION MAY BE REQUIRED SOON"
        status_color = "yellow"
        reasons.append(f"Soil water storage ({current_water_mm} mm) is approaching the stress threshold.")
        reasons.append(f"Current moisture ({moisture_pct}%) is adequate for today but will decline with {etc_mm} mm ETc.")
        reasons.append("Check again tomorrow morning.")
        
        factors = [
            {"title": "Soil Moisture Level", "status": "CHECK", "description": f"Adequate storage ({current_water_mm} mm / {moisture_pct}%)."},
            {"title": "Daily ETc", "status": "INFO", "description": f"Crop consumes {etc_mm} mm/day."},
            {"title": "Rain Forecast", "status": "INFO", "description": f"{rain_tomorrow} mm expected tomorrow."}
        ]
        summary_text = f"Soil water is currently adequate ({current_water_mm} mm), but approaching depletion. Re-evaluate tomorrow."

    else:
        # Optimal
        status = "NO_IRRIGATION_REQUIRED"
        status_display = "NO IRRIGATION REQUIRED"
        status_color = "green"
        reasons.append(f"Soil water storage ({current_water_mm} mm) is at or near target capacity ({target_mm} mm).")
        reasons.append(f"Readily available water is sufficient to satisfy today's ETc ({etc_mm} mm).")
        
        factors = [
            {"title": "Soil Moisture Level", "status": "CHECK", "description": f"Optimal moisture at {moisture_pct}% ({current_water_mm} mm)."},
            {"title": "Water Deficit", "status": "CHECK", "description": f"Zero deficit ({deficit_mm} mm)."},
            {"title": "Crop Water Comfort", "status": "CHECK", "description": "Transpiration demand fully satisfied."}
        ]
        summary_text = f"Current soil moisture ({moisture_pct}%) is optimal. No irrigation needed."

    hours = int(pump_duration_minutes // 60)
    mins = int(pump_duration_minutes % 60)
    duration_formatted = f"{hours}h {mins}m" if hours > 0 else f"{mins} mins"

    scientific_basis = {
        "formula_water_volume": "Volume (L) = (Deficit / Efficiency) * Area (m2)",
        "formula_pump_duration": "Duration (min) = Volume (L) / Pump Flow Rate (L/min)",
        "fao_crop_et": f"ETc = ET0 ({et0} mm) * Kc ({kc}) = {etc_mm} mm/day",
        "soil_threshold": f"Stress Threshold = WP ({wp_mm} mm) + (1 - p:{p}) * TAW ({taw_mm} mm) = {stress_threshold_mm} mm"
    }

    decision_dict = {
        "zone_id": zone.id,
        "zone_name": zone.name,
        "crop_name": crop.name if crop else "Crop",
        "growth_stage": zone.growth_stage,
        "recommendation_date": date.today().isoformat(),
        "status": status,
        "status_display": status_display,
        "status_color": status_color,
        "current_soil_water_mm": current_water_mm,
        "target_soil_water_mm": target_mm,
        "water_deficit_mm": deficit_mm,
        "recommended_irrigation_mm": recommended_irrigation_mm,
        "gross_irrigation_mm": gross_irrigation_mm,
        "irrigation_efficiency_pct": round(efficiency * 100, 1),
        "zone_area_acres": round(area_m2 / 4046.86, 2),
        "zone_area_m2": round(area_m2, 2),
        "water_volume_liters": water_volume_liters,
        "pump_flow_rate_lpm": pump_flow_lpm,
        "pump_duration_minutes": pump_duration_minutes,
        "pump_duration_formatted": duration_formatted,
        "recommended_time": recommended_time,
        "summary_text": summary_text,
        "reasons": reasons,
        "factors": factors,
        "scientific_basis": scientific_basis,
        "provenance": "CALCULATED"
    }

    return decision_dict

async def get_farm_irrigation_overview(db: Session, farm: Farm) -> Dict[str, Any]:
    weather_data = await fetch_weather_data(farm.latitude, farm.longitude)
    recommendations = []
    
    total_volume = 0.0
    total_duration = 0.0
    zones_requiring_irrigation = 0

    for zone in farm.zones:
        rec = evaluate_zone_irrigation(db, zone, weather_data)
        recommendations.append(rec)
        if rec["status"] == "IRRIGATION_REQUIRED":
            zones_requiring_irrigation += 1
            total_volume += rec["water_volume_liters"]
            total_duration += rec["pump_duration_minutes"]

    overall_status = "NO_IRRIGATION_REQUIRED"
    if zones_requiring_irrigation > 0:
        overall_status = "IRRIGATION_REQUIRED"
    elif any(r["status"] == "IRRIGATION_POSTPONED" for r in recommendations):
        overall_status = "IRRIGATION_POSTPONED"
    elif any(r["status"] == "MONITOR_SOIL" for r in recommendations):
        overall_status = "MONITOR_SOIL"

    return {
        "farm_id": farm.id,
        "farm_name": farm.name,
        "overall_status": overall_status,
        "active_zones_count": len(farm.zones),
        "zones_requiring_irrigation_count": zones_requiring_irrigation,
        "total_recommended_volume_liters": round(total_volume, 0),
        "total_pump_duration_minutes": round(total_duration, 1),
        "recommendations": recommendations
    }

def log_applied_irrigation(
    db: Session,
    zone: FarmZone,
    applied_depth_mm: Optional[float] = None,
    applied_volume_liters: Optional[float] = None,
    duration_minutes: Optional[float] = None,
    notes: Optional[str] = None
) -> IrrigationRecord:
    area_m2 = zone.area_m2 or (zone.area * 4046.86)
    efficiency = zone.irrigation_efficiency or 0.90
    pump_flow = zone.pump_flow_rate_lpm or 300.0

    if applied_depth_mm is not None:
        depth = applied_depth_mm
        volume = (depth / efficiency) * area_m2
        duration = volume / pump_flow
    elif applied_volume_liters is not None:
        volume = applied_volume_liters
        depth = (volume / area_m2) * efficiency
        duration = volume / pump_flow
    elif duration_minutes is not None:
        duration = duration_minutes
        volume = duration * pump_flow
        depth = (volume / area_m2) * efficiency
    else:
        # Default replenish to target
        depth = max(0.0, zone.target_soil_water_mm - zone.current_soil_water_mm)
        volume = (depth / efficiency) * area_m2
        duration = volume / pump_flow

    # Replenish soil water in zone
    zone.current_soil_water_mm = min(zone.field_capacity_mm, zone.current_soil_water_mm + depth)
    zone.updated_at = datetime.utcnow()

    record = IrrigationRecord(
        zone_id=zone.id,
        applied_date=date.today(),
        applied_depth_mm=round(depth, 2),
        applied_volume_liters=round(volume, 0),
        duration_minutes=round(duration, 1),
        method=zone.irrigation_method or "Drip",
        source="Manual Trigger",
        notes=notes or "Precision irrigation applied"
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record
