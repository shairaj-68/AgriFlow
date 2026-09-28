from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class SoilWaterRecord(Base):
    __tablename__ = "soil_water_records"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("farm_zones.id", ondelete="CASCADE"), nullable=False)
    record_date = Column(Date, nullable=False, index=True)
    
    # Soil Water Balance Components (all in mm)
    previous_water_mm = Column(Float, nullable=False)
    rainfall_mm = Column(Float, default=0.0)
    irrigation_mm = Column(Float, default=0.0)
    etc_mm = Column(Float, default=0.0)
    runoff_mm = Column(Float, default=0.0)
    drainage_mm = Column(Float, default=0.0)
    remaining_water_mm = Column(Float, nullable=False)
    
    # Volumetric Soil Moisture %
    soil_moisture_pct = Column(Float, nullable=False)
    
    # Provenance
    is_simulated = Column(Boolean, default=True)  # True for Phase 1 simulation, False for IoT sensor
    created_at = Column(DateTime, default=datetime.utcnow)

    zone = relationship("FarmZone", back_populates="soil_records")
