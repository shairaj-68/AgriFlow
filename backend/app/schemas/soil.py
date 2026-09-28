from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class WaterBalanceBreakdown(BaseModel):
    previous_water_mm: float
    rainfall_mm: float
    irrigation_mm: float
    etc_mm: float
    runoff_mm: float
    drainage_mm: float
    remaining_water_mm: float

class SoilStatus(BaseModel):
    zone_id: int
    zone_name: str
    crop_name: str
    growth_stage: str
    current_soil_water_mm: float
    target_soil_water_mm: float
    field_capacity_mm: float
    wilting_point_mm: float
    stress_threshold_mm: float  # RAW threshold = FC - (1 - p)*TAW
    total_available_water_mm: float  # TAW = FC - WP
    readily_available_water_mm: float # RAW = p * TAW
    volumetric_moisture_pct: float
    relative_available_water_pct: float  # (Current - WP) / (FC - WP) * 100
    status: str  # OPTIMAL, MODERATE, STRESS, WATERLOGGED
    is_simulated: bool = True
    provenance: str = "SIMULATED"
    water_balance_today: WaterBalanceBreakdown

class SoilSeriesPoint(BaseModel):
    date: str
    soil_water_mm: float
    soil_moisture_pct: float
    rainfall_mm: float
    irrigation_mm: float
    etc_mm: float
    field_capacity_mm: float
    wilting_point_mm: float
    stress_threshold_mm: float

class SoilSimulationRequest(BaseModel):
    days: int = 1  # 1 to 30
    custom_rainfall_mm: Optional[float] = None
    custom_irrigation_mm: Optional[float] = None
    scenario: Optional[str] = None  # "DRY_SPELL", "HEAVY_RAIN", "NORMAL"

class SoilSimulationResponse(BaseModel):
    zone_id: int
    days_simulated: int
    starting_water_mm: float
    ending_water_mm: float
    ending_moisture_pct: float
    records_created: int
    message: str
