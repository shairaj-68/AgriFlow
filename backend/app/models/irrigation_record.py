from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.session import Base

class IrrigationRecord(Base):
    __tablename__ = "irrigation_records"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("farm_zones.id", ondelete="CASCADE"), nullable=False)
    applied_date = Column(Date, nullable=False, index=True)
    
    applied_depth_mm = Column(Float, nullable=False)
    applied_volume_liters = Column(Float, nullable=False)
    duration_minutes = Column(Float, nullable=False)
    method = Column(String(50), default="Drip")
    source = Column(String(50), default="Simulation")  # Manual, Simulation, Automatic
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    zone = relationship("FarmZone", back_populates="irrigation_records")

class IrrigationRecommendation(Base):
    __tablename__ = "irrigation_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("farm_zones.id", ondelete="CASCADE"), nullable=False)
    recommendation_date = Column(Date, nullable=False, index=True)
    
    # Status: NO_IRRIGATION_REQUIRED, IRRIGATION_REQUIRED, IRRIGATION_POSTPONED, MONITOR_SOIL
    status = Column(String(50), nullable=False)
    
    water_deficit_mm = Column(Float, default=0.0)
    recommended_irrigation_mm = Column(Float, default=0.0)
    water_volume_liters = Column(Float, default=0.0)
    pump_duration_minutes = Column(Float, default=0.0)
    recommended_time = Column(String(20), default="06:00 AM")
    
    # Explainable reasons JSON / structured text
    reasons_json = Column(Text, nullable=False)
    details_json = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    zone = relationship("FarmZone", back_populates="recommendations")
