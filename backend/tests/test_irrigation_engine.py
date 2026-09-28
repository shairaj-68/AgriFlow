import pytest
from app.services.irrigation_service import evaluate_zone_irrigation
from app.models.farm import Farm
from app.models.farm_zone import FarmZone
from app.models.crop import Crop
from app.database.session import Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

@pytest.fixture
def db_session():
    test_engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(test_engine)
    Session = sessionmaker(bind=test_engine)
    session = Session()
    yield session
    session.close()

def create_mock_farm_zone(db, current_water=55.0, area_acres=1.0, efficiency=0.90, flow_rate=300.0):
    crop = Crop(
        name="Tomato",
        kc_flowering=1.15,
        field_capacity_pct=32.0,
        wilting_point_pct=14.0,
        critical_depletion_fraction=0.40
    )
    db.add(crop)
    db.commit()
    db.refresh(crop)

    farm = Farm(
        user_id=1,
        name="Test Farm",
        latitude=11.34,
        longitude=77.71,
        area=area_acres,
        area_unit="Acre",
        area_m2=area_acres * 4046.86,
        pump_flow_rate_lpm=flow_rate,
        irrigation_efficiency=efficiency
    )
    db.add(farm)
    db.commit()
    db.refresh(farm)

    zone = FarmZone(
        farm_id=farm.id,
        crop_id=crop.id,
        name="Zone 1",
        growth_stage="Flowering",
        area=area_acres,
        area_unit="Acre",
        area_m2=area_acres * 4046.86,
        field_capacity_mm=110.0,
        wilting_point_mm=45.0,
        current_soil_water_mm=current_water,
        target_soil_water_mm=100.0,
        irrigation_method="Drip",
        pump_flow_rate_lpm=flow_rate,
        irrigation_efficiency=efficiency
    )
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return zone

def test_irrigation_required_decision(db_session):
    # Soil water = 55 mm (Below stress threshold: 45 + (1 - 0.4)*65 = 84 mm)
    zone = create_mock_farm_zone(db_session, current_water=55.0)
    weather_data = {
        "current": {"temperature_c": 30.0, "relative_humidity_pct": 45.0, "wind_speed_ms": 2.5, "solar_radiation_wm2": 400.0},
        "forecast_7d": [{"rainfall_sum_mm": 0.0, "precipitation_probability_pct": 5}, {"rainfall_sum_mm": 0.0, "precipitation_probability_pct": 5}]
    }

    decision = evaluate_zone_irrigation(db_session, zone, weather_data)
    assert decision["status"] == "IRRIGATION_REQUIRED"
    assert decision["status_color"] == "red"
    assert decision["water_deficit_mm"] == 45.0  # 100 - 55
    assert decision["water_volume_liters"] > 0
    assert decision["pump_duration_minutes"] > 0
    assert len(decision["reasons"]) >= 3
    assert len(decision["factors"]) >= 3

def test_irrigation_postponed_when_rain_forecast(db_session):
    # Soil water is low, but significant rain (15mm) is forecast
    zone = create_mock_farm_zone(db_session, current_water=55.0)
    weather_data = {
        "current": {"temperature_c": 28.0, "relative_humidity_pct": 60.0, "wind_speed_ms": 3.0, "solar_radiation_wm2": 200.0},
        "forecast_7d": [
            {"rainfall_sum_mm": 0.0, "precipitation_probability_pct": 10},
            {"rainfall_sum_mm": 18.0, "precipitation_probability_pct": 80}
        ]
    }

    decision = evaluate_zone_irrigation(db_session, zone, weather_data)
    assert decision["status"] == "IRRIGATION_POSTPONED"
    assert decision["status_color"] == "blue"
    assert "rainfall" in decision["summary_text"].lower()

def test_no_irrigation_when_optimal(db_session):
    # Soil water is near target (100 mm)
    zone = create_mock_farm_zone(db_session, current_water=98.0)
    weather_data = {
        "current": {"temperature_c": 26.0, "relative_humidity_pct": 65.0, "wind_speed_ms": 2.0, "solar_radiation_wm2": 300.0},
        "forecast_7d": [{"rainfall_sum_mm": 0.0, "precipitation_probability_pct": 0}]
    }

    decision = evaluate_zone_irrigation(db_session, zone, weather_data)
    assert decision["status"] == "NO_IRRIGATION_REQUIRED"
    assert decision["status_color"] == "green"
