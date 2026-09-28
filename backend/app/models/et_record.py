from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey
from app.database.session import Base

class ETRecord(Base):
    __tablename__ = "et_records"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    zone_id = Column(Integer, ForeignKey("farm_zones.id", ondelete="CASCADE"), nullable=True)
    record_date = Column(Date, nullable=False, index=True)
    
    # ET Calculations
    et0_mm = Column(Float, nullable=False)      # Reference ET0 (FAO-56 Penman-Monteith)
    kc = Column(Float, nullable=False)          # Crop coefficient used
    etc_mm = Column(Float, nullable=False)      # Crop ETc = ET0 * Kc
    
    # Metadata
    calculation_method = Column(String(50), default="FAO-56 Penman-Monteith")
    created_at = Column(DateTime, default=datetime.utcnow)
