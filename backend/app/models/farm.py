from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.session import Base

class Farm(Base):
    __tablename__ = "farms"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    location_name = Column(String(255), default="Farm Location")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    # Area & Unit
    area = Column(Float, default=2.0)  # in specified unit
    area_unit = Column(String(20), default="Acre")  # Acre, Hectare, m2
    area_m2 = Column(Float, default=8093.72)  # Normalized area in square meters
    
    # Primary Soil & Irrigation defaults
    soil_type = Column(String(100), default="Loam")  # Sandy, Loamy Sand, Sandy Loam, Loam, Silt Loam, Clay Loam, Clay
    root_zone_depth_cm = Column(Float, default=60.0)
    irrigation_method = Column(String(50), default="Drip")  # Drip, Sprinkler, Flood
    pump_flow_rate_lpm = Column(Float, default=500.0)  # Liters per minute
    irrigation_efficiency = Column(Float, default=0.90)  # 0.90 for Drip, 0.75 for Sprinkler, 0.60 for Flood
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="farms")
    zones = relationship("FarmZone", back_populates="farm", cascade="all, delete-orphan")
    weather_records = relationship("WeatherRecord", back_populates="farm", cascade="all, delete-orphan")
    sensor_devices = relationship("SensorDevice", back_populates="farm", cascade="all, delete-orphan")
