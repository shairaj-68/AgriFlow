from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.zone import FarmZoneResponse

class FarmBase(BaseModel):
    name: str
    location_name: str = "Farm Location"
    latitude: float
    longitude: float
    area: float = 2.0
    area_unit: str = "Acre"
    soil_type: str = "Loam"
    root_zone_depth_cm: float = 60.0
    irrigation_method: str = "Drip"
    pump_flow_rate_lpm: float = 500.0
    irrigation_efficiency: float = 0.90
    is_active: bool = True

class FarmCreate(FarmBase):
    pass

class FarmUpdate(BaseModel):
    name: Optional[str] = None
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    area: Optional[float] = None
    area_unit: Optional[str] = None
    soil_type: Optional[str] = None
    root_zone_depth_cm: Optional[float] = None
    irrigation_method: Optional[str] = None
    pump_flow_rate_lpm: Optional[float] = None
    irrigation_efficiency: Optional[float] = None
    is_active: Optional[bool] = None

class FarmResponse(FarmBase):
    id: int
    user_id: int
    area_m2: float
    created_at: datetime
    updated_at: datetime
    zones: Optional[List[FarmZoneResponse]] = []

    class Config:
        from_attributes = True
