from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.farm import Farm
from app.models.farm_zone import FarmZone
from app.models.sensor_device import SensorDevice
from app.schemas.sensor import (
    SensorDeviceCreate,
    SensorDeviceResponse,
    SensorReadinessInfo
)
from app.api.deps import get_current_user

router = APIRouter(tags=["Sensors & IoT Integration"])

@router.get("/farms/{farm_id}/sensors", response_model=List[SensorDeviceResponse])
def get_farm_sensors(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    return farm.sensor_devices

@router.get("/farms/{farm_id}/sensors/readiness", response_model=SensorReadinessInfo)
def get_sensor_readiness(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    online_sensors = [s for s in farm.sensor_devices if s.status == "ONLINE"]
    mode = "IOT_SENSOR" if len(online_sensors) > 0 else "SIMULATED"

    return SensorReadinessInfo(
        current_phase="PHASE 1 (Software Simulation — Phase 2 Hardware Ready)",
        sensor_integration_ready=True,
        mqtt_broker_endpoint="mqtt://broker.agriflow.local:1883",
        esp32_firmware_support="ESP-IDF / Arduino C++ v2.4 (MQTT JSON Telemetry)",
        connected_devices_count=len(farm.sensor_devices),
        data_provider_mode=mode
    )

@router.post("/sensors/register", response_model=SensorDeviceResponse, status_code=status.HTTP_201_CREATED)
def register_sensor(
    sensor_in: SensorDeviceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(SensorDevice).filter(SensorDevice.device_id == sensor_in.device_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="A device with this hardware ID is already registered")

    device = SensorDevice(
        farm_id=sensor_in.farm_id,
        zone_id=sensor_in.zone_id,
        device_name=sensor_in.device_name,
        device_type=sensor_in.device_type,
        device_id=sensor_in.device_id,
        protocol=sensor_in.protocol,
        topic=sensor_in.topic or f"agriflow/{sensor_in.device_id}/telemetry",
        status="NOT_CONNECTED",
        last_seen=None,
        last_value=None
    )
    db.add(device)
    db.commit()
    db.refresh(device)
    return device

@router.post("/sensors/{device_id}/mock-ping")
def mock_sensor_ping(
    device_id: str,
    telemetry_value: str = "39.2",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Simulates an incoming MQTT telemetry packet from an ESP32 edge node for demonstration."""
    device = db.query(SensorDevice).filter(SensorDevice.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    device.status = "ONLINE"
    device.last_seen = datetime.utcnow()
    device.last_value = telemetry_value
    db.commit()
    db.refresh(device)

    return {
        "success": True,
        "message": f"Received MQTT telemetry from {device.device_name}: {telemetry_value}%",
        "device": device
    }
