import pytest
from app.models.crop import Crop
from app.models.farm import Farm
from app.models.farm_zone import FarmZone
from app.services.ml_feature_service import extract_features_for_zone
from app.services.ml_et_model import predict_evapotranspiration
from app.services.ml_soil_model import predict_soil_moisture_dynamics
from app.services.ml_irrigation_model import predict_irrigation_need_and_volume

@pytest.fixture
def sample_zone_and_weather():
    crop = Crop(
        id=1,
        name="Tomato",
        kc_seedling=0.45,
        kc_vegetative=0.75,
        kc_flowering=1.15,
        kc_fruiting=1.10,
        kc_maturity=0.80,
        field_capacity_pct=32.0,
        wilting_point_pct=14.0,
        critical_depletion_fraction=0.40
    )
    farm = Farm(id=1, name="Test Precision Farm", latitude=11.3482, longitude=77.7172, area=4.5)
    zone = FarmZone(
        id=1,
        farm_id=1,
        crop_id=1,
        name="Zone 1 — Tomato North",
        growth_stage="Flowering",
        area=1.5,
        area_unit="Acre",
        area_m2=6070.29,
        field_capacity_mm=110.0,
        wilting_point_mm=45.0,
        current_soil_water_mm=58.0,
        target_soil_water_mm=100.0,
        irrigation_method="Drip",
        pump_flow_rate_lpm=350.0,
        irrigation_efficiency=0.90,
        root_zone_depth_cm=60.0
    )
    zone.crop = crop
    zone.farm = farm

    weather_data = {
        "current": {
            "temperature_c": 32.0,
            "temperature_max_c": 36.0,
            "temperature_min_c": 22.0,
            "relative_humidity_pct": 45.0,
            "wind_speed_ms": 2.8,
            "solar_radiation_wm2": 260.0,
            "surface_pressure_kpa": 101.0,
            "rainfall_mm": 0.0
        },
        "daily_forecast": [
            {"date": "2026-08-29", "temperature_max_c": 35.0, "temperature_min_c": 21.0, "relative_humidity_pct": 42.0, "wind_speed_ms": 2.5, "solar_radiation_wm2": 250.0, "rainfall_mm": 0.0},
            {"date": "2026-08-30", "temperature_max_c": 36.0, "temperature_min_c": 22.0, "relative_humidity_pct": 40.0, "wind_speed_ms": 3.0, "solar_radiation_wm2": 270.0, "rainfall_mm": 0.0},
            {"date": "2026-08-31", "temperature_max_c": 34.0, "temperature_min_c": 20.0, "relative_humidity_pct": 48.0, "wind_speed_ms": 2.2, "solar_radiation_wm2": 240.0, "rainfall_mm": 0.0},
            {"date": "2026-09-01", "temperature_max_c": 33.0, "temperature_min_c": 19.0, "relative_humidity_pct": 52.0, "wind_speed_ms": 2.0, "solar_radiation_wm2": 230.0, "rainfall_mm": 0.0},
            {"date": "2026-09-02", "temperature_max_c": 34.0, "temperature_min_c": 20.0, "relative_humidity_pct": 45.0, "wind_speed_ms": 2.4, "solar_radiation_wm2": 245.0, "rainfall_mm": 0.0},
            {"date": "2026-09-03", "temperature_max_c": 35.0, "temperature_min_c": 21.0, "relative_humidity_pct": 43.0, "wind_speed_ms": 2.6, "solar_radiation_wm2": 255.0, "rainfall_mm": 0.0},
            {"date": "2026-09-04", "temperature_max_c": 35.5, "temperature_min_c": 21.5, "relative_humidity_pct": 44.0, "wind_speed_ms": 2.7, "solar_radiation_wm2": 260.0, "rainfall_mm": 0.0}
        ]
    }

    return zone, weather_data

def test_feature_engineering_extraction(sample_zone_and_weather):
    zone, weather_data = sample_zone_and_weather
    features = extract_features_for_zone(zone, weather_data)

    assert "vpd_kpa" in features
    assert features["vpd_kpa"] > 0
    assert features["kc"] == 1.15  # Tomato flowering Kc
    assert features["stress_threshold_mm"] == pytest.approx(84.0, abs=1.0)
    assert features["water_deficit_mm"] == 42.0
    assert features["forecast_rain_7d"] == 0.0

def test_model_1_et_forecaster(sample_zone_and_weather):
    zone, weather_data = sample_zone_and_weather
    features = extract_features_for_zone(zone, weather_data)
    model_1 = predict_evapotranspiration(features, weather_data)

    assert model_1.predicted_et0_today_mm > 0
    assert model_1.predicted_etc_today_mm > model_1.predicted_et0_today_mm  # Because Kc > 1.0
    assert len(model_1.forecast_series) == 7
    assert len(model_1.top_feature_importances) >= 4
    # Top feature should be Solar radiation
    assert model_1.top_feature_importances[0].feature_name == "solar_radiation_wm2"

def test_model_2_soil_moisture_forecaster(sample_zone_and_weather):
    zone, weather_data = sample_zone_and_weather
    features = extract_features_for_zone(zone, weather_data)
    model_1 = predict_evapotranspiration(features, weather_data)
    model_2 = predict_soil_moisture_dynamics(features, model_1, weather_data)

    assert model_2.current_water_mm == 58.0
    assert model_2.stress_threshold_mm == pytest.approx(84.0, abs=1.0)
    # Current water is 58mm < 84mm threshold => stress is immediate
    assert model_2.projected_days_until_stress == 1
    assert model_2.stress_risk_index > 0.5
    assert len(model_2.forecast_trajectory) == 7

def test_model_3_irrigation_prediction(sample_zone_and_weather):
    zone, weather_data = sample_zone_and_weather
    features = extract_features_for_zone(zone, weather_data)
    model_1 = predict_evapotranspiration(features, weather_data)
    model_2 = predict_soil_moisture_dynamics(features, model_1, weather_data)
    model_3 = predict_irrigation_need_and_volume(features, model_1, model_2, weather_data)

    assert model_3.predicted_decision == "IRRIGATION_REQUIRED"
    assert model_3.irrigation_needed_probability_pct >= 85.0
    assert model_3.predicted_net_deficit_mm == 42.0
    assert model_3.predicted_gross_depth_mm == pytest.approx(46.7, abs=0.5)
    assert model_3.predicted_water_volume_liters > 200000.0
    assert model_3.predicted_pump_duration_minutes > 500.0

def test_model_3_rain_postponement_behavior(sample_zone_and_weather):
    zone, weather_data = sample_zone_and_weather
    # Add heavy rainfall forecast to day 1 and 2
    weather_data["daily_forecast"][0]["rainfall_mm"] = 15.0
    weather_data["daily_forecast"][1]["rainfall_mm"] = 10.0

    features = extract_features_for_zone(zone, weather_data)
    model_1 = predict_evapotranspiration(features, weather_data)
    model_2 = predict_soil_moisture_dynamics(features, model_1, weather_data)
    model_3 = predict_irrigation_need_and_volume(features, model_1, model_2, weather_data)

    assert model_3.predicted_decision == "IRRIGATION_POSTPONED"
    assert model_3.predicted_water_volume_liters == 0.0
