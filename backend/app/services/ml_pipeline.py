from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.farm import Farm
from app.models.farm_zone import FarmZone
from app.schemas.ml_prediction import (
    ZoneMLPredictionResponse,
    FarmMLPredictionOverview
)
from app.services.weather_service import fetch_weather_data
from app.services.ml_feature_service import extract_features_for_zone
from app.services.ml_et_model import predict_evapotranspiration
from app.services.ml_soil_model import predict_soil_moisture_dynamics
from app.services.ml_irrigation_model import predict_irrigation_need_and_volume

async def run_ml_pipeline_for_zone(db: Session, zone: FarmZone, weather_data: Dict[str, Any] = None) -> ZoneMLPredictionResponse:
    """
    Executes the Complete Multi-Stage Machine Learning Pipeline for a single Zone:
    1. Weather Telemetry Extraction
    2. Feature Engineering (ET0, ETc, Kc, Soil Water, Deficit, Trends)
    3. Model 1 (ET Prediction) & Model 2 (Soil Moisture Forecast) in Parallel/Sequential
    4. Model 3 (Irrigation Decision & Volume Synthesis)
    5. Formats structured prediction response
    """
    if weather_data is None:
        weather_data = await fetch_weather_data(zone.farm.latitude, zone.farm.longitude)

    # Step 1 & 2: Feature Engineering
    features = extract_features_for_zone(zone, weather_data)

    # Step 3: Model 1 (ET Forecaster)
    model_1_et = predict_evapotranspiration(features, weather_data)

    # Step 4: Model 2 (Soil Moisture Dynamics Forecaster)
    model_2_soil = predict_soil_moisture_dynamics(features, model_1_et, weather_data)

    # Step 5: Model 3 (Irrigation Decision & Volume Synthesizer)
    model_3_irrigation = predict_irrigation_need_and_volume(features, model_1_et, model_2_soil, weather_data)

    # Synthesis Rationale Narrative
    crop_name = zone.crop.name if zone.crop else "Crop"
    if model_3_irrigation.predicted_decision == "IRRIGATION_REQUIRED":
        summary = (
            f"AI Pipeline indicates high irrigation necessity ({model_3_irrigation.irrigation_needed_probability_pct}%). "
            f"Model 2 projects root-zone storage at {model_2_soil.current_water_mm} mm (Threshold: {model_2_soil.stress_threshold_mm} mm). "
            f"Model 1 forecasts cumulative 7-day ETc demand of {model_1_et.cumulative_7d_etc_loss_mm} mm. "
            f"Apply {model_3_irrigation.predicted_gross_depth_mm} mm ({model_3_irrigation.predicted_water_volume_liters:,.0f} L) for ~{model_3_irrigation.predicted_pump_duration_minutes:.0f} mins."
        )
    elif model_3_irrigation.predicted_decision == "IRRIGATION_POSTPONED":
        summary = (
            f"AI Pipeline postponed irrigation despite low soil storage ({model_2_soil.current_water_mm} mm). "
            f"Significant rainfall ({features.get('forecast_rain_3d', 0)} mm) predicted within 48-72h by meteorological features. "
            f"Postponement avoids root hypoxia and groundwater leaching."
        )
    elif model_3_irrigation.predicted_decision == "MONITOR_SOIL":
        summary = (
            f"Soil water storage is currently adequate ({model_2_soil.current_water_mm} mm), but Model 2 projects "
            f"stress threshold breach in {model_2_soil.projected_days_until_stress or '2-3'} days under daily ETc loss of {model_1_et.predicted_etc_today_mm} mm/day. "
            f"Re-evaluate tomorrow morning."
        )
    else:
        summary = (
            f"Soil water storage is optimal ({model_2_soil.current_water_mm} mm, {model_2_soil.current_moisture_pct}% θv). "
            f"Crop transpiration demand ({model_1_et.predicted_etc_today_mm} mm/day) is well supported by root-zone moisture reserves."
        )

    return ZoneMLPredictionResponse(
        zone_id=zone.id,
        zone_name=zone.name,
        crop_name=crop_name,
        growth_stage=zone.growth_stage,
        area_acres=round(float(features.get("area_acres", 1.0)), 2),
        timestamp=datetime.utcnow().isoformat(),
        features_engineered_count=len(features),
        model_1_et=model_1_et,
        model_2_soil=model_2_soil,
        model_3_irrigation=model_3_irrigation,
        synthesis_summary=summary,
        provenance="PREDICTED"
    )

async def run_ml_pipeline_for_farm(db: Session, farm: Farm) -> FarmMLPredictionOverview:
    """
    Executes the Complete Multi-Stage Machine Learning Pipeline for all active Zones on a Farm.
    """
    weather_data = await fetch_weather_data(farm.latitude, farm.longitude)
    zone_predictions = []
    zones_requiring_water = 0
    total_predicted_volume = 0.0

    for zone in farm.zones:
        pred = await run_ml_pipeline_for_zone(db, zone, weather_data)
        zone_predictions.append(pred)
        if pred.model_3_irrigation.predicted_decision in ["IRRIGATION_REQUIRED", "MONITOR_SOIL"]:
            zones_requiring_water += 1
        total_predicted_volume += pred.model_3_irrigation.predicted_water_volume_liters

    return FarmMLPredictionOverview(
        farm_id=farm.id,
        farm_name=farm.name,
        generated_at=datetime.utcnow().isoformat(),
        total_active_zones=len(farm.zones),
        zones_requiring_water_soon=zones_requiring_water,
        total_predicted_volume_liters_7d=round(total_predicted_volume, 0),
        pipeline_architecture_status="OPERATIONAL",
        zone_predictions=zone_predictions
    )
