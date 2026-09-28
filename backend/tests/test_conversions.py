import pytest
from app.api.farms import compute_area_m2

def test_area_conversions():
    # 1 Hectare = 10,000 m2
    assert compute_area_m2(1.0, "Hectare") == 10000.0
    assert compute_area_m2(2.5, "ha") == 25000.0
    
    # 1 Acre ≈ 4,046.86 m2
    assert compute_area_m2(1.0, "Acre") == 4046.86
    assert compute_area_m2(2.0, "Acre") == 8093.72
    
    # m2 to m2
    assert compute_area_m2(5000.0, "m2") == 5000.0

def test_water_volume_conversions():
    # 1 mm over 1 hectare = 10,000 Liters
    depth_mm = 1.0
    area_ha_m2 = 10000.0
    volume_liters = depth_mm * area_ha_m2
    assert volume_liters == 10000.0

    # 1 mm over 1 acre = 4,046.86 Liters
    area_acre_m2 = 4046.86
    volume_acre_liters = depth_mm * area_acre_m2
    assert round(volume_acre_liters, 2) == 4046.86

def test_pump_duration_calculation():
    # 32,376 Liters at 500 L/min flow rate = 64.75 minutes
    volume_l = 32376.0
    flow_lpm = 500.0
    duration_min = volume_l / flow_lpm
    assert round(duration_min, 2) == 64.75
