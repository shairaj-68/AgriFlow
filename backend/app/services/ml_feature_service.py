import numpy as np
import pandas as pd
from typing import Dict, Any, List
from app.models.farm_zone import FarmZone
from app.services.et_service import (
    calculate_saturation_vapor_pressure,
    calculate_actual_vapor_pressure,
    calculate_fao56_penman_monteith,
    calculate_crop_et
)

def extract_features_for_zone(zone: FarmZone, weather_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Feature Engineering Layer:
    Transforms raw atmospheric telemetry and farm zone parameters into a multi-dimensional
    feature dictionary with physical indices, lag windows, and crop physiological factors.
    """
    curr = weather_data.get("current", {})
    daily_forecast = weather_data.get("daily_forecast", [])

    # 1. Base Atmospheric Telemetry
    temp_c = float(curr.get("temperature_c", 25.0))
    temp_max_c = float(curr.get("temperature_max_c", temp_c + 4.0))
    temp_min_c = float(curr.get("temperature_min_c", temp_c - 4.0))
    rh_pct = float(curr.get("relative_humidity_pct", 50.0))
    wind_ms = float(curr.get("wind_speed_ms", 2.0))
    solar_wm2 = float(curr.get("solar_radiation_wm2", 220.0))
    pressure_kpa = float(curr.get("surface_pressure_kpa", 101.3))
    rainfall_mm = float(curr.get("rainfall_mm", 0.0))

    # 2. Psychrometric & Biophysical Calculations
    es = calculate_saturation_vapor_pressure(temp_c)
    ea = calculate_actual_vapor_pressure(es, rh_pct)
    vpd_kpa = max(0.01, es - ea)
    temp_diurnal_range = max(1.0, temp_max_c - temp_min_c)

    # Convert Solar Radiation W/m2 to MJ/m2/day
    solar_mj = solar_wm2 * 0.0864
    rn_mj = max(2.0, 0.77 * solar_mj - 1.5)

    # 3. Reference and Crop Evapotranspiration (ET0 & ETc)
    et0_mm, _ = calculate_fao56_penman_monteith(
        temp_c=temp_c,
        humidity_pct=rh_pct,
        wind_speed_ms=wind_ms,
        solar_radiation_wm2=solar_wm2,
        pressure_kpa=pressure_kpa,
        temp_max_c=temp_max_c,
        temp_min_c=temp_min_c
    )

    crop = zone.crop
    kc = 1.0
    if crop:
        stage = (zone.growth_stage or "Flowering").lower()
        if "seedling" in stage:
            kc = crop.kc_seedling
        elif "veg" in stage:
            kc = crop.kc_vegetative
        elif "flower" in stage:
            kc = crop.kc_flowering
        elif "fruit" in stage:
            kc = crop.kc_fruiting
        elif "matur" in stage:
            kc = crop.kc_maturity

    etc_mm = calculate_crop_et(et0_mm, kc)

    # 4. Soil Hydrologic State Features
    fc_mm = float(zone.field_capacity_mm)
    wp_mm = float(zone.wilting_point_mm)
    taw_mm = max(1.0, fc_mm - wp_mm)
    p_depletion = float(crop.critical_depletion_fraction if crop else 0.5)
    raw_mm = taw_mm * p_depletion
    stress_threshold_mm = wp_mm + (1.0 - p_depletion) * taw_mm
    current_water_mm = float(zone.current_soil_water_mm)
    target_water_mm = float(zone.target_soil_water_mm)

    available_water_pct = max(0.0, min(100.0, ((current_water_mm - wp_mm) / taw_mm) * 100.0))
    water_deficit_mm = max(0.0, target_water_mm - current_water_mm)
    depletion_severity = max(0.0, (stress_threshold_mm - current_water_mm) / taw_mm) if current_water_mm < stress_threshold_mm else 0.0

    # 5. Temporal Trend & Forecast Lookaheads (Next 3d and 7d)
    forecast_rain_3d = sum(float(d.get("rainfall_mm", 0.0)) for d in daily_forecast[:3])
    forecast_rain_7d = sum(float(d.get("rainfall_mm", 0.0)) for d in daily_forecast[:7])
    forecast_mean_temp_7d = np.mean([float(d.get("temperature_max_c", temp_c)) for d in daily_forecast[:7]]) if daily_forecast else temp_c
    forecast_mean_solar_7d = np.mean([float(d.get("solar_radiation_wm2", solar_wm2)) for d in daily_forecast[:7]]) if daily_forecast else solar_wm2

    # Synthetic Thermal Sum (Growing Degree Days GDD baseline 10°C)
    gdd_today = max(0.0, ((temp_max_c + temp_min_c) / 2.0) - 10.0)

    features = {
        # Raw Atmospheric
        "temp_c": temp_c,
        "temp_max_c": temp_max_c,
        "temp_min_c": temp_min_c,
        "temp_diurnal_range": round(temp_diurnal_range, 2),
        "rh_pct": rh_pct,
        "wind_ms": wind_ms,
        "solar_wm2": solar_wm2,
        "solar_mj": round(solar_mj, 2),
        "rn_mj": round(rn_mj, 2),
        "pressure_kpa": pressure_kpa,
        "rainfall_mm": rainfall_mm,
        "vpd_kpa": round(vpd_kpa, 3),
        "gdd_today": round(gdd_today, 2),

        # Agronomic & Biophysical
        "et0_mm": round(et0_mm, 2),
        "kc": round(kc, 2),
        "etc_mm": round(etc_mm, 2),
        "root_depth_cm": float(zone.root_zone_depth_cm),
        "critical_depletion_p": p_depletion,

        # Soil Hydrologic Storage
        "current_water_mm": current_water_mm,
        "field_capacity_mm": fc_mm,
        "wilting_point_mm": wp_mm,
        "taw_mm": round(taw_mm, 2),
        "raw_mm": round(raw_mm, 2),
        "stress_threshold_mm": round(stress_threshold_mm, 2),
        "target_water_mm": target_water_mm,
        "available_water_pct": round(available_water_pct, 1),
        "water_deficit_mm": round(water_deficit_mm, 2),
        "depletion_severity": round(depletion_severity, 3),

        # Trend & Forecast Lookahead
        "forecast_rain_3d": round(forecast_rain_3d, 2),
        "forecast_rain_7d": round(forecast_rain_7d, 2),
        "forecast_mean_temp_7d": round(forecast_mean_temp_7d, 2),
        "forecast_mean_solar_7d": round(forecast_mean_solar_7d, 2),

        # Hydraulic Line
        "area_acres": float(zone.area if zone.area_unit.lower() == 'acre' else zone.area * 2.47105),
        "area_m2": float(zone.area_m2),
        "irrigation_efficiency": float(zone.irrigation_efficiency),
        "pump_flow_rate_lpm": float(zone.pump_flow_rate_lpm)
    }

    return features
