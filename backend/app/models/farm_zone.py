from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.session import Base

class FarmZone(Base):
    __tablename__ = "farm_zones"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    crop_id = Column(Integer, ForeignKey("crops.id"), nullable=False)
    
    name = Column(String(100), nullable=False)  # e.g., "Zone 1 - Main Field"
    growth_stage = Column(String(50), default="Flowering")  # Seedling, Vegetative, Flowering, Fruiting, Maturity
    
    # Specific Area for this zone
    area = Column(Float, default=1.0)
    area_unit = Column(String(20), default="Acre")
    area_m2 = Column(Float, default=4046.86)
    
    # Soil & Root Parameters
    soil_type = Column(String(100), default="Loam")
    root_zone_depth_cm = Column(Float, default=60.0)
    field_capacity_mm = Column(Float, default=120.0)  # Total water at field capacity in root zone (mm)
    wilting_point_mm = Column(Float, default=48.0)   # Total water at permanent wilting point (mm)
    
    # Current Water State
    current_soil_water_mm = Column(Float, default=75.0)  # Current storage in root zone (mm)
    target_soil_water_mm = Column(Float, default=110.0)   # Management target water level (mm)
    
    # Zone-specific Irrigation equipment
    irrigation_method = Column(String(50), default="Drip")
    pump_flow_rate_lpm = Column(Float, default=300.0)
    irrigation_efficiency = Column(Float, default=0.90)
    
    # Map Polygon or bounding geometry JSON string
    polygon_json = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    farm = relationship("Farm", back_populates="zones")
    crop = relationship("Crop", back_populates="zones")
    soil_records = relationship("SoilWaterRecord", back_populates="zone", cascade="all, delete-orphan")
    irrigation_records = relationship("IrrigationRecord", back_populates="zone", cascade="all, delete-orphan")
    recommendations = relationship("IrrigationRecommendation", back_populates="zone", cascade="all, delete-orphan")
    sensors = relationship("SensorDevice", back_populates="zone", cascade="all, delete-orphan")
