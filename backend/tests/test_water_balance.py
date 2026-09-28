import pytest
from app.services.soil_water_service import calculate_daily_water_balance

def test_water_balance_normal_depletion():
    # Day with no rain and no irrigation, ETc = 5.0 mm
    prev = 80.0
    rain = 0.0
    irrig = 0.0
    etc = 5.0
    fc = 110.0
    wp = 45.0
    
    remaining, runoff, drainage = calculate_daily_water_balance(prev, rain, irrig, etc, fc, wp)
    assert remaining == 75.0
    assert runoff == 0.0
    assert drainage == 0.0

def test_water_balance_irrigation_replenish():
    # Day with irrigation applied
    prev = 60.0
    rain = 0.0
    irrig = 20.0
    etc = 5.0
    fc = 110.0
    wp = 45.0
    
    remaining, runoff, drainage = calculate_daily_water_balance(prev, rain, irrig, etc, fc, wp)
    assert remaining == 75.0
    assert drainage == 0.0

def test_water_balance_overflow_drainage():
    # Heavy rainfall causes overflow beyond field capacity
    prev = 100.0
    rain = 30.0  # ~28.5 mm effective
    irrig = 0.0
    etc = 3.5
    fc = 110.0
    wp = 45.0
    
    remaining, runoff, drainage = calculate_daily_water_balance(prev, rain, irrig, etc, fc, wp)
    assert remaining == fc  # Must be clamped at FC
    assert drainage > 0.0   # Excess water drains into deep soil layers

def test_water_balance_wilting_point_clamping():
    # Extreme drought must not drop below physical wilting point
    prev = 47.0
    rain = 0.0
    irrig = 0.0
    etc = 6.0
    fc = 110.0
    wp = 45.0
    
    remaining, runoff, drainage = calculate_daily_water_balance(prev, rain, irrig, etc, fc, wp)
    assert remaining == wp
