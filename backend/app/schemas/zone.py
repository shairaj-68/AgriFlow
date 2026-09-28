from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.crop import CropResponse

class FarmZoneBase(BaseModel):
    name: str
    crop_id: int
    growth_stage: str = "Flowering"  # Seedling, Vegetative, Flowering, Fruiting, Maturity
    area: float = 1.0
    area_unit: str = "Acre"
    soil_type: str = "Loam"
    root_zone_depth_cm: float = 60.0
    field_capacity_mm: float = 120.0
    wilting_point_mm: float = 48.0
    current_soil_water_mm: float = 75.0
    target_soil_water_mm: float = 110.0
    irrigation_method: str = "Drip"
    pump_flow_rate_lpm: float = 300.0
    irrigation_efficiency: float = 0.90
    polygon_json: Optional[str] = None

class FarmZoneCreate(FarmZoneBase):
    farm_id: int

class FarmZoneUpdate(BaseModel):
    name: Optional[str] = None
    crop_id: Optional[int] = None
    growth_stage: Optional[str] = None
    area: Optional[float] = None
    area_unit: Optional[str] = None
    soil_type: Optional[str] = None
    root_zone_depth_cm: Optional[float] = None
    field_capacity_mm: Optional[float] = None
    wilting_point_mm: Optional[float] = None
    current_soil_water_mm: Optional[float] = None
    target_soil_water_mm: Optional[float] = None
    irrigation_method: Optional[str] = None
    pump_flow_rate_lpm: Optional[float] = None
    irrigation_efficiency: Optional[float] = None
    polygon_json: Optional[str] = None

class FarmZoneResponse(FarmZoneBase):
    id: int
    farm_id: int
    area_m2: float
    created_at: datetime
    updated_at: datetime
    crop: Optional[CropResponse] = None

    class Config:
        from_attributes = True
