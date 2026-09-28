from pydantic import BaseModel
from typing import List, Dict

class ConsumptionComparisonPoint(BaseModel):
    date: str
    traditional_liters: float
    agriflow_liters: float
    saved_liters: float

class AnalyticsOverview(BaseModel):
    farm_id: int
    time_range: str  # 7d, 30d, 90d
    total_traditional_liters: float
    total_agriflow_liters: float
    estimated_saved_liters: float
    estimated_savings_pct: float
    
    # Financial & Energy
    estimated_pump_hours_saved: float
    estimated_electricity_kwh_saved: float
    
    # Agronomic averages
    average_daily_et0_mm: float
    average_daily_etc_mm: float
    average_soil_moisture_pct: float
    total_rainfall_mm: float
    irrigation_events_count: int
    
    chart_series: List[ConsumptionComparisonPoint]
    provenance: str = "CALCULATED"
    disclaimer: str = "Estimated savings compared against standard fixed calendar-based irrigation schedules."
