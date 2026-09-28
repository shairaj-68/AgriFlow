from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SensorDeviceBase(BaseModel):
    farm_id: int
    zone_id: Optional[int] = None
    device_name: str
    device_type: str  # Soil Moisture, DHT22, Rain Sensor, Flow Meter, ESP32 Gateway
    device_id: str
    protocol: str = "MQTT"
    topic: Optional[str] = "agriflow/sensors/zone1"

class SensorDeviceCreate(SensorDeviceBase):
    pass

class SensorDeviceResponse(SensorDeviceBase):
    id: int
    status: str  # ONLINE, OFFLINE, NOT_CONNECTED, SIMULATED
    last_seen: Optional[datetime] = None
    last_value: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SensorReadinessInfo(BaseModel):
    current_phase: str = "PHASE 1 (Software Simulation)"
    sensor_integration_ready: bool = True
    mqtt_broker_endpoint: str = "mqtt://broker.agriflow.local:1883"
    esp32_firmware_support: str = "ESP-IDF / Arduino C++ v2.4"
    connected_devices_count: int
    data_provider_mode: str  # SIMULATED or IOT_SENSOR
