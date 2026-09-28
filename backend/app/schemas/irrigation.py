from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, date

class IrrigationFactor(BaseModel):
    title: str
    status: str  # CHECK, ALERT, INFO, WARN
    description: str

class IrrigationRecommendationResponse(BaseModel):
    zone_id: int
    zone_name: str
    crop_name: str
    growth_stage: str
    recommendation_date: str
    
    # Primary Decision
    status: str  # IRRIGATION_REQUIRED, NO_IRRIGATION_REQUIRED, IRRIGATION_POSTPONED, MONITOR_SOIL
    status_display: str
    status_color: str  # red, green, blue, yellow
    
    # Quantitative parameters
    current_soil_water_mm: float
    target_soil_water_mm: float
    water_deficit_mm: float
    recommended_irrigation_mm: float
    gross_irrigation_mm: float  # Adjusted for efficiency
    irrigation_efficiency_pct: float
    
    # Volume and runtime
    zone_area_acres: float
    zone_area_m2: float
    water_volume_liters: float
    pump_flow_rate_lpm: float
    pump_duration_minutes: float
    pump_duration_formatted: str
    recommended_time: str
    
    # Explainability
    summary_text: str
    reasons: List[str]
    factors: List[IrrigationFactor]
    scientific_basis: Dict[str, str]
    
    provenance: str = "CALCULATED"

class FarmIrrigationOverview(BaseModel):
    farm_id: int
    farm_name: str
    overall_status: str
    active_zones_count: int
    zones_requiring_irrigation_count: int
    total_recommended_volume_liters: float
    total_pump_duration_minutes: float
    recommendations: List[IrrigationRecommendationResponse]

class ApplyIrrigationRequest(BaseModel):
    applied_depth_mm: Optional[float] = None
    applied_volume_liters: Optional[float] = None
    duration_minutes: Optional[float] = None
    notes: Optional[str] = "Manual irrigation applied"

class IrrigationLogItem(BaseModel):
    id: int
    zone_id: int
    zone_name: str
    applied_date: str
    applied_depth_mm: float
    applied_volume_liters: float
    duration_minutes: float
    method: str
    source: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
