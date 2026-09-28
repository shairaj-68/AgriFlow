from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.database.session import Base

class Crop(Base):
    __tablename__ = "crops"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(String(255), nullable=True)
    
    # Root depth range (cm)
    root_depth_min_cm = Column(Float, default=30.0)
    root_depth_max_cm = Column(Float, default=90.0)
    
    # FAO-56 Crop Coefficients (Kc) for 5 stages
    kc_seedling = Column(Float, default=0.45)
    kc_vegetative = Column(Float, default=0.75)
    kc_flowering = Column(Float, default=1.15)
    kc_fruiting = Column(Float, default=1.10)
    kc_maturity = Column(Float, default=0.80)
    
    # Soil moisture tolerances (% of Available Water Capacity)
    field_capacity_pct = Column(Float, default=32.0)  # % volumetric water
    wilting_point_pct = Column(Float, default=14.0)   # % volumetric water
    critical_depletion_fraction = Column(Float, default=0.50)  # p factor (0.4-0.6)
    
    # Recommended Soil Moisture Range (%)
    recommended_min_moisture_pct = Column(Float, default=35.0)
    recommended_max_moisture_pct = Column(Float, default=65.0)
    
    is_system = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    zones = relationship("FarmZone", back_populates="crop")
