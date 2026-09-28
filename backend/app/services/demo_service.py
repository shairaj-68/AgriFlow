import json
from datetime import datetime, date, timedelta, timezone
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.farm import Farm
from app.models.farm_zone import FarmZone
from app.models.crop import Crop
from app.models.soil_water_record import SoilWaterRecord
from app.models.sensor_device import SensorDevice
from app.core.security import get_password_hash
from app.services.crop_service import seed_default_crops

DEMO_USER_EMAIL = "demo@agriflow.ai"
DEMO_USER_PASSWORD = "agriflow_demo_password_2026"

def setup_demo_farm(db: Session) -> Tuple[User, Farm]:
    seed_default_crops(db)
    
    # 1. Create or retrieve demo user
    user = db.query(User).filter(User.email == DEMO_USER_EMAIL).first()
    if not user:
        user = User(
            email=DEMO_USER_EMAIL,
            hashed_password=get_password_hash(DEMO_USER_PASSWORD),
            full_name="Rajesh Kumar (AgriFlow Demo Farmer)",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # 2. Check if demo farm exists
    farm = db.query(Farm).filter(Farm.user_id == user.id, Farm.name == "Green Valley Precision Farm").first()
    if not farm:
        farm = Farm(
            user_id=user.id,
            name="Green Valley Precision Farm",
            location_name="Erode, Tamil Nadu, India",
            latitude=11.3482,
            longitude=77.7172,
            area=4.5,
            area_unit="Acre",
            area_m2=18210.87,
            soil_type="Sandy Loam",
            root_zone_depth_cm=65.0,
            irrigation_method="Drip",
            pump_flow_rate_lpm=500.0,
            irrigation_efficiency=0.90,
            is_active=True
        )
        db.add(farm)
        db.commit()
        db.refresh(farm)

    # 3. Add 3 realistic zones
    tomato_crop = db.query(Crop).filter(Crop.name == "Tomato").first()
    maize_crop = db.query(Crop).filter(Crop.name == "Maize").first()
    groundnut_crop = db.query(Crop).filter(Crop.name == "Groundnut").first()

    existing_zones = db.query(FarmZone).filter(FarmZone.farm_id == farm.id).all()
    if not existing_zones:
        # Zone 1: Tomato (Water stressed -> triggers IRRIGATION_REQUIRED)
        z1 = FarmZone(
            farm_id=farm.id,
            crop_id=tomato_crop.id if tomato_crop else 1,
            name="Zone 1 — Tomato North",
            growth_stage="Flowering",
            area=1.5,
            area_unit="Acre",
            area_m2=6070.29,
            soil_type="Sandy Loam",
            root_zone_depth_cm=60.0,
            field_capacity_mm=110.0,
            wilting_point_mm=45.0,
            current_soil_water_mm=58.0,  # Below stress threshold (71 mm) -> Triggers Irrigation
            target_soil_water_mm=100.0,
            irrigation_method="Drip",
            pump_flow_rate_lpm=350.0,
            irrigation_efficiency=0.90,
            polygon_json=json.dumps([
                [11.3495, 77.7160],
                [11.3495, 77.7180],
                [11.3475, 77.7180],
                [11.3475, 77.7160]
            ])
        )

        # Zone 2: Maize (Adequate moisture -> NO_IRRIGATION_REQUIRED)
        z2 = FarmZone(
            farm_id=farm.id,
            crop_id=maize_crop.id if maize_crop else 2,
            name="Zone 2 — Maize Central",
            growth_stage="Vegetative",
            area=1.5,
            area_unit="Acre",
            area_m2=6070.29,
            soil_type="Loam",
            root_zone_depth_cm=75.0,
            field_capacity_mm=130.0,
            wilting_point_mm=52.0,
            current_soil_water_mm=112.0,  # Optimal moisture -> Green status
            target_soil_water_mm=120.0,
            irrigation_method="Drip",
            pump_flow_rate_lpm=400.0,
            irrigation_efficiency=0.90,
            polygon_json=json.dumps([
                [11.3475, 77.7160],
                [11.3475, 77.7180],
                [11.3455, 77.7180],
                [11.3455, 77.7160]
            ])
        )

        # Zone 3: Groundnut (Moderate water -> MONITOR_SOIL)
        z3 = FarmZone(
            farm_id=farm.id,
            crop_id=groundnut_crop.id if groundnut_crop else 3,
            name="Zone 3 — Groundnut South",
            growth_stage="Flowering",
            area=1.5,
            area_unit="Acre",
            area_m2=6070.29,
            soil_type="Sandy Loam",
            root_zone_depth_cm=50.0,
            field_capacity_mm=95.0,
            wilting_point_mm=38.0,
            current_soil_water_mm=68.0,  # Approaching threshold
            target_soil_water_mm=90.0,
            irrigation_method="Sprinkler",
            pump_flow_rate_lpm=300.0,
            irrigation_efficiency=0.75,
            polygon_json=json.dumps([
                [11.3455, 77.7160],
                [11.3455, 77.7180],
                [11.3435, 77.7180],
                [11.3435, 77.7160]
            ])
        )

        db.add_all([z1, z2, z3])
        db.commit()
        db.refresh(z1)
        db.refresh(z2)
        db.refresh(z3)

        # 4. Create IoT Sensor registration placeholders (Phase 2 Sensor-Ready)
        sensors = [
            SensorDevice(
                farm_id=farm.id,
                zone_id=z1.id,
                device_name="ESP32-Node-Tomato-01",
                device_type="Soil Moisture",
                device_id="ESP32_A1_B2_C3_01",
                protocol="MQTT",
                topic="agriflow/node1/moisture",
                status="SIMULATED",
                last_value="38.5"
            ),
            SensorDevice(
                farm_id=farm.id,
                zone_id=z2.id,
                device_name="ESP32-Node-Maize-02",
                device_type="DHT22 Weather Probe",
                device_id="ESP32_A1_B2_C3_02",
                protocol="MQTT",
                topic="agriflow/node2/environment",
                status="NOT_CONNECTED",
                last_value=None
            )
        ]
        db.add_all(sensors)

        # 5. Populate 7 days of realistic history
        today = date.today()
        for i in range(7, 0, -1):
            past_date = today - timedelta(days=i)
            
            # Step down soil moisture for Zone 1
            z1_water = 85.0 - (7 - i) * 4.5
            db.add(SoilWaterRecord(
                zone_id=z1.id,
                record_date=past_date,
                previous_water_mm=z1_water + 4.5,
                rainfall_mm=0.0,
                irrigation_mm=0.0,
                etc_mm=4.5,
                runoff_mm=0.0,
                drainage_mm=0.0,
                remaining_water_mm=z1_water,
                soil_moisture_pct=round(14.0 + ((z1_water - 45.0) / 65.0) * 18.0, 1),
                is_simulated=True
            ))

            # Optimal steady for Zone 2
            db.add(SoilWaterRecord(
                zone_id=z2.id,
                record_date=past_date,
                previous_water_mm=114.0,
                rainfall_mm=0.0,
                irrigation_mm=0.0,
                etc_mm=5.2,
                runoff_mm=0.0,
                drainage_mm=0.0,
                remaining_water_mm=112.0,
                soil_moisture_pct=28.5,
                is_simulated=True
            ))

        db.commit()

    return user, farm
