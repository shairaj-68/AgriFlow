from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.farm_zone import FarmZone
from app.models.sensor_device import SensorDevice

class SoilDataProvider(ABC):
    """
    Abstract Data Provider Interface for Soil Moisture and Water Balance metrics.
    Ensures the core Irrigation Decision Engine is completely decoupled from whether
    data originates from deterministic software simulation (Phase 1) or physical ESP32
    IoT sensors over MQTT (Phase 2/3).
    """

    @abstractmethod
    def get_soil_moisture_pct(self, db: Session, zone: FarmZone) -> float:
        """Returns volumetric soil moisture percentage (e.g. 38.5%)."""
        pass

    @abstractmethod
    def get_soil_water_mm(self, db: Session, zone: FarmZone) -> float:
        """Returns current available root zone water storage in millimeters."""
        pass

    @abstractmethod
    def get_provenance_badge(self) -> str:
        """Returns provenance badge label (SIMULATED vs REAL)."""
        pass

class SimulatedSoilDataProvider(SoilDataProvider):
    """
    Phase 1 Default: Statefully calculates soil moisture from the deterministic
    daily soil water balance storage in the database.
    """

    def get_soil_moisture_pct(self, db: Session, zone: FarmZone) -> float:
        taw_mm = max(1.0, zone.field_capacity_mm - zone.wilting_point_mm)
        available_water_mm = max(0.0, zone.current_soil_water_mm - zone.wilting_point_mm)
        fraction = min(1.0, available_water_mm / taw_mm)
        
        # Scale between crop/soil wilting point % and field capacity %
        fc_pct = zone.crop.field_capacity_pct if zone.crop else 32.0
        wp_pct = zone.crop.wilting_point_pct if zone.crop else 14.0
        moisture_pct = wp_pct + fraction * (fc_pct - wp_pct)
        return round(max(5.0, min(60.0, moisture_pct)), 1)

    def get_soil_water_mm(self, db: Session, zone: FarmZone) -> float:
        return round(zone.current_soil_water_mm, 2)

    def get_provenance_badge(self) -> str:
        return "SIMULATED"

class IoTSoilDataProvider(SoilDataProvider):
    """
    Phase 2/3 Sensor Integration: Retrieves live calibrated soil moisture telemetry
    from connected ESP32 sensor devices via MQTT / Database records.
    """

    def get_soil_moisture_pct(self, db: Session, zone: FarmZone) -> float:
        sensor = db.query(SensorDevice).filter(
            SensorDevice.zone_id == zone.id,
            SensorDevice.device_type.in_(["Soil Moisture", "Capacitive Soil Sensor"]),
            SensorDevice.status == "ONLINE"
        ).first()

        if sensor and sensor.last_value is not None:
            try:
                return round(float(sensor.last_value), 1)
            except ValueError:
                pass
        
        # Graceful fallback to simulation if sensor is offline
        simulated = SimulatedSoilDataProvider()
        return simulated.get_soil_moisture_pct(db, zone)

    def get_soil_water_mm(self, db: Session, zone: FarmZone) -> float:
        moisture_pct = self.get_soil_moisture_pct(db, zone)
        fc_pct = zone.crop.field_capacity_pct if zone.crop else 32.0
        wp_pct = zone.crop.wilting_point_pct if zone.crop else 14.0
        
        fraction = max(0.0, min(1.0, (moisture_pct - wp_pct) / max(1.0, fc_pct - wp_pct)))
        taw_mm = max(1.0, zone.field_capacity_mm - zone.wilting_point_mm)
        water_mm = zone.wilting_point_mm + fraction * taw_mm
        return round(water_mm, 2)

    def get_provenance_badge(self) -> str:
        return "REAL"

def get_soil_data_provider(mode: str = "SIMULATED") -> SoilDataProvider:
    if mode.upper() == "IOT_SENSOR":
        return IoTSoilDataProvider()
    return SimulatedSoilDataProvider()
