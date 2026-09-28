from pydantic import BaseModel
from typing import Optional, List, Dict

class PsychrometricDetails(BaseModel):
    delta_slope_kpa_c: float
    psychrometric_constant_gamma: float
    saturation_vapor_pressure_es_kpa: float
    actual_vapor_pressure_ea_kpa: float
    vapor_pressure_deficit_vpd_kpa: float
    net_radiation_rn_mj_m2: float
    soil_heat_flux_g_mj_m2: float
    mean_temp_c: float
    wind_speed_u2_ms: float

class ETCalculationRequest(BaseModel):
    temperature_c: float
    relative_humidity_pct: float
    wind_speed_ms: float
    solar_radiation_wm2: Optional[float] = None
    solar_radiation_mj_m2_day: Optional[float] = None
    crop_name: Optional[str] = "Tomato"
    growth_stage: Optional[str] = "Flowering"
    custom_kc: Optional[float] = None
    latitude: Optional[float] = 11.3482
    day_of_year: Optional[int] = 180

class ETCalculationResponse(BaseModel):
    reference_et0_mm_day: float
    crop_coefficient_kc: float
    crop_etc_mm_day: float
    calculation_method: str = "FAO-56 Penman-Monteith"
    fallback_used: bool = False
    provenance: str = "CALCULATED"
    psychrometrics: PsychrometricDetails
    explanation: Dict[str, str]

class ETSeriesPoint(BaseModel):
    date: str
    et0_mm: float
    etc_mm: float
    kc: float
    temp_c: float
    rainfall_mm: float

class ETOverviewResponse(BaseModel):
    farm_id: int
    current_et0_mm: float
    current_etc_mm: float
    current_kc: float
    crop_name: str
    growth_stage: str
    method: str
    trend_7d: List[ETSeriesPoint]
    provenance: str = "CALCULATED"
