from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class WeatherRecord(Base):
    __tablename__ = "weather_records"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime, nullable=False, index=True)
    
    # Weather variables
    temperature_c = Column(Float, nullable=False)
    temperature_max_c = Column(Float, nullable=True)
    temperature_min_c = Column(Float, nullable=True)
    relative_humidity_pct = Column(Float, nullable=False)
    wind_speed_ms = Column(Float, nullable=False)
    solar_radiation_wm2 = Column(Float, default=200.0)  # W/m2 or MJ/m2/day
    surface_pressure_kpa = Column(Float, default=101.3)
    rainfall_mm = Column(Float, default=0.0)
    weather_code = Column(Integer, default=0)
    
    is_forecast = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    farm = relationship("Farm", back_populates="weather_records")
