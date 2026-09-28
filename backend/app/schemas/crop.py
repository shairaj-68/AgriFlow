from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CropBase(BaseModel):
    name: str
    description: Optional[str] = None
    root_depth_min_cm: float = 30.0
    root_depth_max_cm: float = 90.0
    kc_seedling: float = 0.45
    kc_vegetative: float = 0.75
    kc_flowering: float = 1.15
    kc_fruiting: float = 1.10
    kc_maturity: float = 0.80
    field_capacity_pct: float = 32.0
    wilting_point_pct: float = 14.0
    critical_depletion_fraction: float = 0.50
    recommended_min_moisture_pct: float = 35.0
    recommended_max_moisture_pct: float = 65.0

class CropCreate(CropBase):
    pass

class CropUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    root_depth_min_cm: Optional[float] = None
    root_depth_max_cm: Optional[float] = None
    kc_seedling: Optional[float] = None
    kc_vegetative: Optional[float] = None
    kc_flowering: Optional[float] = None
    kc_fruiting: Optional[float] = None
    kc_maturity: Optional[float] = None
    field_capacity_pct: Optional[float] = None
    wilting_point_pct: Optional[float] = None
    critical_depletion_fraction: Optional[float] = None
    recommended_min_moisture_pct: Optional[float] = None
    recommended_max_moisture_pct: Optional[float] = None

class CropResponse(CropBase):
    id: int
    is_system: bool
    created_at: datetime

    class Config:
        from_attributes = True
