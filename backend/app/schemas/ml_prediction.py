from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import date, datetime

class FeatureImportanceItem(BaseModel):
    feature_name: str
    importance_score: float  # 0.0 to 1.0
    impact_direction: str   # 'INCREASES_DEMAND', 'DECREASES_DEMAND', 'MODERATE'
    display_name: str

class Model1ETPrediction(BaseModel):
    model_name: str = "Model 1: Atmospheric ET Forecaster"
    target: str = "Reference & Crop Evapotranspiration (ET0 & ETc)"
    forecast_days: int = 7
    predicted_et0_today_mm: float
    predicted_etc_today_mm: float
    predicted_mean_daily_etc_7d: float
    cumulative_7d_etc_loss_mm: float
    confidence_score_pct: float  # e.g. 94.5%
    forecast_series: List[Dict[str, Any]]
    top_feature_importances: List[FeatureImportanceItem]

class Model2SoilMoisturePrediction(BaseModel):
    model_name: str = "Model 2: Root-Zone Soil Moisture Forecaster"
    target: str = "Soil Water Storage & Volumetric Moisture Trajectory"
    current_moisture_pct: float
    current_water_mm: float
    stress_threshold_mm: float
    wilting_point_mm: float
    field_capacity_mm: float
    projected_days_until_stress: Optional[int]  # e.g. 2 days or None if optimal
    stress_risk_index: float  # 0.0 (Safe) to 1.0 (Critical)
    wilting_probability_pct: float
    forecast_trajectory: List[Dict[str, Any]]
    top_feature_importances: List[FeatureImportanceItem]

class Model3IrrigationPrediction(BaseModel):
    model_name: str = "Model 3: Predictive Irrigation Decision & Volume Synthesizer"
    target: str = "Irrigation Need Probability & Optimal Volumetric Sizing"
    irrigation_needed_probability_pct: float  # 0 to 100%
    predicted_decision: str  # 'IRRIGATION_REQUIRED', 'MONITOR_SOIL', 'NO_IRRIGATION_REQUIRED', 'IRRIGATION_POSTPONED'
    predicted_net_deficit_mm: float
    predicted_gross_depth_mm: float
    predicted_water_volume_liters: float
    predicted_pump_duration_minutes: float
    optimal_window_recommendation: str
    leaching_risk_score: float  # 0.0 to 1.0
    under_irrigation_risk_score: float  # 0.0 to 1.0
    fused_model_weights: Dict[str, float]

class ZoneMLPredictionResponse(BaseModel):
    zone_id: int
    zone_name: str
    crop_name: str
    growth_stage: str
    area_acres: float
    timestamp: str
    features_engineered_count: int
    model_1_et: Model1ETPrediction
    model_2_soil: Model2SoilMoisturePrediction
    model_3_irrigation: Model3IrrigationPrediction
    synthesis_summary: str
    provenance: str = "PREDICTED"

class FarmMLPredictionOverview(BaseModel):
    farm_id: int
    farm_name: str
    generated_at: str
    total_active_zones: int
    zones_requiring_water_soon: int
    total_predicted_volume_liters_7d: float
    pipeline_architecture_status: str
    zone_predictions: List[ZoneMLPredictionResponse]
