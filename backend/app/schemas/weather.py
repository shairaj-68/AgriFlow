from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class CurrentWeather(BaseModel):
    temperature_c: float
    relative_humidity_pct: float
    wind_speed_ms: float
    wind_speed_kmh: float
    solar_radiation_wm2: float
    surface_pressure_kpa: float
    rainfall_mm: float
    weather_code: int
    weather_description: str
    provenance: str = "API"  # API or RETRIEVED

class DailyForecast(BaseModel):
    date: str
    temperature_max_c: float
    temperature_min_c: float
    relative_humidity_mean_pct: float
    wind_speed_max_ms: float
    shortwave_radiation_mj_m2: float
    rainfall_sum_mm: float
    precipitation_probability_pct: int
    weather_code: int
    weather_description: str
    et0_forecast_mm: float

class WeatherOverviewResponse(BaseModel):
    farm_id: int
    latitude: float
    longitude: float
    timezone: str
    current: CurrentWeather
    forecast_7d: List[DailyForecast]
    cached: bool
    last_updated: datetime
