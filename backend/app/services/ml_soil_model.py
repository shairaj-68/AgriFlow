import numpy as np
from typing import Dict, Any, List
from app.schemas.ml_prediction import Model2SoilMoisturePrediction, FeatureImportanceItem, Model1ETPrediction

def predict_soil_moisture_dynamics(
    features: Dict[str, Any],
    model_1_et: Model1ETPrediction,
    weather_data: Dict[str, Any]
) -> Model2SoilMoisturePrediction:
    """
    Model 2: Root-Zone Soil Moisture Dynamics Predictor
    Forecasts multi-day soil water depletion and moisture percentage trajectories
    based on Model 1's predicted evapotranspiration and precipitation infiltration.
    """
    fc_mm = float(features.get("field_capacity_mm", 120.0))
    wp_mm = float(features.get("wilting_point_mm", 48.0))
    taw_mm = float(features.get("taw_mm", fc_mm - wp_mm))
    stress_threshold_mm = float(features.get("stress_threshold_mm", wp_mm + 0.5 * taw_mm))
    root_depth_cm = float(features.get("root_depth_cm", 60.0))

    current_water_mm = float(features.get("current_water_mm", 75.0))
    current_moisture_pct = round((current_water_mm / (root_depth_cm * 10.0)) * 100.0, 1)

    daily_forecast = weather_data.get("daily_forecast", [])
    forecast_series = model_1_et.forecast_series

    trajectory = []
    sim_water = current_water_mm
    days_until_stress = None

    for idx, item in enumerate(forecast_series):
        etc_loss = float(item.get("predicted_etc_mm", 5.0))
        
        # Rainfall from weather forecast
        rain = 0.0
        if idx < len(daily_forecast):
            rain = float(daily_forecast[idx].get("rainfall_mm", 0.0))

        # Hydrologic mass balance state transition
        # W_{t} = clamp(W_{t-1} + P - ETc, WP, FC)
        sim_water = sim_water + (rain * 0.85) - etc_loss
        sim_water = max(wp_mm, min(fc_mm, sim_water))

        moisture_pct = round((sim_water / (root_depth_cm * 10.0)) * 100.0, 1)
        is_stressed = sim_water <= stress_threshold_mm

        if is_stressed and days_until_stress is None:
            days_until_stress = idx + 1

        trajectory.append({
            "day_index": idx + 1,
            "date": item.get("date", f"Day +{idx+1}"),
            "predicted_soil_water_mm": round(sim_water, 2),
            "predicted_moisture_pct": moisture_pct,
            "stress_threshold_mm": round(stress_threshold_mm, 2),
            "field_capacity_mm": round(fc_mm, 2),
            "wilting_point_mm": round(wp_mm, 2),
            "is_stressed": is_stressed,
            "predicted_rain_mm": round(rain, 1),
            "predicted_etc_loss_mm": round(etc_loss, 2)
        })

    # Calculate Stress Risk Index (0.0 to 1.0)
    if current_water_mm <= wp_mm:
        stress_risk_index = 1.0
        wilting_prob = 98.0
    elif current_water_mm <= stress_threshold_mm:
        deficit_factor = (stress_threshold_mm - current_water_mm) / (stress_threshold_mm - wp_mm + 0.001)
        stress_risk_index = round(0.6 + 0.4 * deficit_factor, 2)
        wilting_prob = round(40.0 + 50.0 * deficit_factor, 1)
    else:
        buffer_factor = (current_water_mm - stress_threshold_mm) / (fc_mm - stress_threshold_mm + 0.001)
        stress_risk_index = round(max(0.05, 0.5 * (1.0 - buffer_factor)), 2)
        wilting_prob = round(max(1.0, 15.0 * (1.0 - buffer_factor)), 1)

    feature_importances = [
        FeatureImportanceItem(
            feature_name="current_water_mm",
            display_name="Current Root-Zone Soil Storage",
            importance_score=0.45,
            impact_direction="DECREASES_DEMAND"
        ),
        FeatureImportanceItem(
            feature_name="etc_mm",
            display_name="Predicted Cumulative ETc Loss",
            importance_score=0.25,
            impact_direction="INCREASES_DEMAND"
        ),
        FeatureImportanceItem(
            feature_name="critical_depletion_p",
            display_name="Crop Allowable Depletion Factor (p)",
            importance_score=0.15,
            impact_direction="INCREASES_DEMAND"
        ),
        FeatureImportanceItem(
            feature_name="forecast_rain_7d",
            display_name="Forecasted Infiltration Rain",
            importance_score=0.10,
            impact_direction="DECREASES_DEMAND"
        ),
        FeatureImportanceItem(
            feature_name="root_depth_cm",
            display_name="Effective Rooting Zone Depth",
            importance_score=0.05,
            impact_direction="DECREASES_DEMAND"
        )
    ]

    return Model2SoilMoisturePrediction(
        current_moisture_pct=current_moisture_pct,
        current_water_mm=round(current_water_mm, 2),
        stress_threshold_mm=round(stress_threshold_mm, 2),
        wilting_point_mm=round(wp_mm, 2),
        field_capacity_mm=round(fc_mm, 2),
        projected_days_until_stress=days_until_stress,
        stress_risk_index=stress_risk_index,
        wilting_probability_pct=wilting_prob,
        forecast_trajectory=trajectory,
        top_feature_importances=feature_importances
    )
