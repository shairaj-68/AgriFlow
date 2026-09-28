from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class SensorDevice(Base):
    __tablename__ = "sensor_devices"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    zone_id = Column(Integer, ForeignKey("farm_zones.id", ondelete="CASCADE"), nullable=True)
    
    device_name = Column(String(100), nullable=False)  # e.g. "ESP32-Node-01"
    device_type = Column(String(50), nullable=False)  # Soil Moisture, DHT22, Rain Sensor, Flow Meter, ESP32 Gateway
    device_id = Column(String(100), unique=True, index=True, nullable=False)  # MAC address or UUID
    protocol = Column(String(20), default="MQTT")
    topic = Column(String(100), default="agriflow/sensors/zone1")
    
    status = Column(String(20), default="NOT_CONNECTED")  # ONLINE, OFFLINE, NOT_CONNECTED, SIMULATED
    last_seen = Column(DateTime, nullable=True)
    last_value = Column(String(100), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    farm = relationship("Farm", back_populates="sensor_devices")
    zone = relationship("FarmZone", back_populates="sensors")
