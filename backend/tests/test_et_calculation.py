import pytest
import numpy as np
from app.services.et_service import (
    calculate_fao56_penman_monteith,
    calculate_hargreaves_fallback,
    calculate_crop_et,
    calculate_saturation_vapor_pressure,
    calculate_delta_slope,
    calculate_et_series_vectorized
)

def test_saturation_vapor_pressure():
    # At 20°C, saturation vapor pressure es should be ~2.338 kPa
    es_20 = calculate_saturation_vapor_pressure(20.0)
    assert 2.30 <= es_20 <= 2.40
    
    # At 30°C, es should be ~4.246 kPa
    es_30 = calculate_saturation_vapor_pressure(30.0)
    assert 4.20 <= es_30 <= 4.30

def test_delta_slope():
    # At 20°C, delta is approximately 0.145 kPa/°C
    delta_20 = calculate_delta_slope(20.0)
    assert 0.13 <= delta_20 <= 0.16

def test_fao56_penman_monteith():
    # Benchmark warm summer day: T=28°C, RH=50%, Wind=2.5 m/s, Rs=22 MJ/m2/day
    et0, psychrometrics = calculate_fao56_penman_monteith(
        temp_c=28.0,
        humidity_pct=50.0,
        wind_speed_ms=2.5,
        solar_radiation_mj_m2_day=22.0
    )
    assert 4.0 <= et0 <= 7.0
    assert "delta_slope_kpa_c" in psychrometrics
    assert "vapor_pressure_deficit_vpd_kpa" in psychrometrics
    assert psychrometrics["vapor_pressure_deficit_vpd_kpa"] > 0

def test_crop_et_calculation():
    et0 = 5.0
    kc_flowering = 1.15
    kc_seedling = 0.45
    
    etc_flowering = calculate_crop_et(et0, kc_flowering)
    etc_seedling = calculate_crop_et(et0, kc_seedling)
    
    assert etc_flowering == 5.75
    assert etc_seedling == 2.25

def test_hargreaves_fallback():
    et0_h = calculate_hargreaves_fallback(temp_mean_c=25.0, temp_max_c=32.0, temp_min_c=18.0)
    assert 3.5 <= et0_h <= 6.5

def test_et_vectorized():
    temps = np.array([25.0, 30.0, 35.0])
    humidities = np.array([60.0, 50.0, 40.0])
    winds = np.array([2.0, 2.5, 3.0])
    radiations = np.array([18.0, 22.0, 25.0])
    kc = 1.15
    
    et0s, etcs = calculate_et_series_vectorized(temps, humidities, winds, radiations, kc)
    assert len(et0s) == 3
    assert len(etcs) == 3
    assert et0s[2] > et0s[0]  # Higher heat & radiation increases ET0
