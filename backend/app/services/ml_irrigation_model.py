import numpy as np
from typing import Dict, Any
from app.schemas.ml_prediction import (
    Model3IrrigationPrediction,
    Model1ETPrediction,
    Model2SoilMoisturePrediction
)

def predict_irrigation_need_and_volume(
    features: Dict[str, Any],
    model_1_et: Model1ETPrediction,
    model_2_soil: Model2SoilMoisturePrediction,
    weather_data: Dict[str, Any]
) -> Model3IrrigationPrediction:
    """
    Model 3: Predictive Irrigation Decision & Volumetric Synthesizer
    Ensemble classifier & regressor fusing Model 1 (ET demand) and Model 2 (Soil Moisture)
    with short-term precipitation lookaheads and hydraulic line parameters.
    """
    current_water_mm = model_2_soil.current_water_mm
    stress_threshold_mm = model_2_soil.stress_threshold_mm
    target_water_mm = float(features.get("target_water_mm", 100.0))
    area_m2 = float(features.get("area_m2", 4046.86))
    efficiency = float(features.get("irrigation_efficiency", 0.90))
    pump_flow_lpm = float(features.get("pump_flow_rate_lpm", 300.0))
    rain_3d = float(features.get("forecast_rain_3d", 0.0))
    daily_etc = model_1_et.predicted_etc_today_mm

    # 1. Feature Synthesis for Irrigation Necessity Probability (0 - 100%)
    # Base probability driven by current water vs stress threshold
    if current_water_mm <= stress_threshold_mm:
        raw_prob = 85.0 + 15.0 * min(1.0, (stress_threshold_mm - current_water_mm) / 20.0)
    elif model_2_soil.projected_days_until_stress is not None and model_2_soil.projected_days_until_stress <= 2:
        raw_prob = 65.0 + 15.0 * (2 - model_2_soil.projected_days_until_stress)
    else:
        raw_prob = max(5.0, 35.0 * (1.0 - (current_water_mm - stress_threshold_mm) / 30.0))

    # Rain lookahead suppression penalty
    if rain_3d >= 7.0:
        raw_prob = max(10.0, raw_prob - 60.0)

    irrigation_prob = round(float(np.clip(raw_prob, 0.0, 100.0)), 1)

    # 2. Decision Classification
    if rain_3d >= 7.0 and current_water_mm <= stress_threshold_mm:
        decision = "IRRIGATION_POSTPONED"
    elif current_water_mm <= stress_threshold_mm or irrigation_prob >= 75.0:
        decision = "IRRIGATION_REQUIRED"
    elif irrigation_prob >= 45.0 or (model_2_soil.projected_days_until_stress and model_2_soil.projected_days_until_stress <= 2):
        decision = "MONITOR_SOIL"
    else:
        decision = "NO_IRRIGATION_REQUIRED"

    # 3. Volumetric & Runtime Regression Sizing
    if decision == "IRRIGATION_REQUIRED":
        net_deficit_mm = max(0.0, target_water_mm - current_water_mm)
        gross_depth_mm = round(net_deficit_mm / efficiency, 1)
        water_volume_liters = round(gross_depth_mm * area_m2, 0)
        pump_duration_minutes = round(water_volume_liters / pump_flow_lpm, 1)
        optimal_window = "06:00 AM (Early Morning)"
    elif decision == "MONITOR_SOIL":
        net_deficit_mm = round(max(0.0, target_water_mm - current_water_mm), 1)
        gross_depth_mm = 0.0
        water_volume_liters = 0.0
        pump_duration_minutes = 0.0
        optimal_window = "Re-evaluate Tomorrow 06:00 AM"
    else:
        net_deficit_mm = 0.0
        gross_depth_mm = 0.0
        water_volume_liters = 0.0
        pump_duration_minutes = 0.0
        optimal_window = "No Action Needed"

    # 4. Agronomic Risk Assessment (0.0 to 1.0)
    # Under-irrigation risk vs Leaching/Over-irrigation risk
    under_irrigation_risk = round(float(model_2_soil.stress_risk_index), 2)
    leaching_risk = round(float(np.clip((rain_3d / 30.0) + (0.3 if current_water_mm > target_water_mm * 0.9 else 0.0), 0.0, 1.0)), 2)

    fused_weights = {
        "model_1_et_weight": 0.35,
        "model_2_soil_storage_weight": 0.45,
        "rain_lookahead_weight": 0.15,
        "crop_sensitivity_weight": 0.05
    }

    return Model3IrrigationPrediction(
        irrigation_needed_probability_pct=irrigation_prob,
        predicted_decision=decision,
        predicted_net_deficit_mm=net_deficit_mm,
        predicted_gross_depth_mm=gross_depth_mm,
        predicted_water_volume_liters=water_volume_liters,
        predicted_pump_duration_minutes=pump_duration_minutes,
        optimal_window_recommendation=optimal_window,
        leaching_risk_score=leaching_risk,
        under_irrigation_risk_score=under_irrigation_risk,
        fused_model_weights=fused_weights
    )
