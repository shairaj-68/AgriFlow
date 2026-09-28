import math
import numpy as np
from typing import Dict, Any, Tuple, Optional, List
from app.models.crop import Crop
from app.services.crop_service import get_crop_kc

def calculate_saturation_vapor_pressure(temp_c: float) -> float:
    """Calculates saturation vapor pressure e_s(T) in kPa (Tetens equation)."""
    return 0.6108 * math.exp((17.27 * temp_c) / (temp_c + 237.3))

def calculate_actual_vapor_pressure(es: float, rh_pct: float) -> float:
    """Calculates actual vapor pressure e_a in kPa."""
    return es * (max(5.0, min(100.0, rh_pct)) / 100.0)

def calculate_delta_slope(temp_c: float) -> float:
    """Calculates slope of vapor pressure curve Delta in kPa / °C."""
    es = calculate_saturation_vapor_pressure(temp_c)
    return (4098.0 * es) / ((temp_c + 237.3) ** 2)

def calculate_psychrometric_constant(pressure_kpa: float = 101.3) -> float:
    """Calculates psychrometric constant gamma in kPa / °C."""
    return 0.000665 * pressure_kpa

def calculate_fao56_penman_monteith(
    temp_c: float,
    humidity_pct: float,
    wind_speed_ms: float,
    solar_radiation_mj_m2_day: Optional[float] = None,
    solar_radiation_wm2: Optional[float] = None,
    pressure_kpa: float = 101.3,
    temp_max_c: Optional[float] = None,
    temp_min_c: Optional[float] = None,
    soil_heat_flux_g: float = 0.0
) -> Tuple[float, Dict[str, Any]]:
    """
    Computes reference evapotranspiration ET0 (mm/day) using the standard FAO-56 Penman-Monteith equation:
    
    ET0 = [0.408 * Delta * (Rn - G) + gamma * (900 / (T + 273)) * u2 * (es - ea)] / [Delta + gamma * (1 + 0.34 * u2)]
    """
    # 1. Convert or estimate solar radiation
    if solar_radiation_mj_m2_day is not None and solar_radiation_mj_m2_day > 0:
        rs_mj = solar_radiation_mj_m2_day
    elif solar_radiation_wm2 is not None and solar_radiation_wm2 > 0:
        rs_mj = solar_radiation_wm2 * 0.0864  # W/m2 to MJ/m2/day
    else:
        # Estimation from temperature range if solar radiation is absent
        t_max = temp_max_c if temp_max_c is not None else temp_c + 5.0
        t_min = temp_min_c if temp_min_c is not None else temp_c - 5.0
        t_range = max(1.0, t_max - t_min)
        rs_mj = 0.16 * math.sqrt(t_range) * 30.0  # Approx extra-terrestrial radiation scaled
    
    # Net radiation Rn (approx 65% of shortwave Rs for standard grass reference canopy)
    rn_mj = max(2.0, 0.65 * rs_mj)
    
    # 2. Psychrometrics
    delta = calculate_delta_slope(temp_c)
    gamma = calculate_psychrometric_constant(pressure_kpa)
    
    es = calculate_saturation_vapor_pressure(temp_c)
    ea = es * (max(5.0, min(100.0, humidity_pct)) / 100.0)
    vpd = max(0.0, es - ea)
    
    # 3. Wind speed at 2m (u2)
    u2 = max(0.2, wind_speed_ms)
    
    # 4. Numerator & Denominator of FAO-56 PM
    rad_term = 0.408 * delta * (rn_mj - soil_heat_flux_g)
    aero_term = gamma * (900.0 / (temp_c + 273.15)) * u2 * vpd
    denominator = delta + gamma * (1.0 + 0.34 * u2)
    
    et0 = (rad_term + aero_term) / denominator
    et0_clamped = max(0.5, min(14.0, round(et0, 2)))
    
    psychrometrics = {
        "delta_slope_kpa_c": round(delta, 4),
        "psychrometric_constant_gamma": round(gamma, 4),
        "saturation_vapor_pressure_es_kpa": round(es, 3),
        "actual_vapor_pressure_ea_kpa": round(ea, 3),
        "vapor_pressure_deficit_vpd_kpa": round(vpd, 3),
        "net_radiation_rn_mj_m2": round(rn_mj, 2),
        "soil_heat_flux_g_mj_m2": round(soil_heat_flux_g, 2),
        "mean_temp_c": round(temp_c, 1),
        "wind_speed_u2_ms": round(u2, 2)
    }
    
    return et0_clamped, psychrometrics

def calculate_hargreaves_fallback(temp_mean_c: float, temp_max_c: float, temp_min_c: float, extraterrestrial_radiation_ra: float = 30.0) -> float:
    """
    Hargreaves-Samani (1985) temperature-based ET0 method used as fallback.
    ET0 = 0.0023 * (Tmean + 17.8) * sqrt(Tmax - Tmin) * Ra * 0.408
    """
    t_diff = max(0.5, temp_max_c - temp_min_c)
    et0 = 0.0023 * (temp_mean_c + 17.8) * math.sqrt(t_diff) * (extraterrestrial_radiation_ra * 0.408)
    return max(0.5, min(14.0, round(et0, 2)))

def calculate_crop_et(et0: float, kc: float) -> float:
    """Calculates Crop Evapotranspiration ETc = ET0 * Kc."""
    return round(max(0.1, et0 * kc), 2)

def calculate_et_series_vectorized(
    temps: np.ndarray,
    humidities: np.ndarray,
    winds: np.ndarray,
    radiations_mj: np.ndarray,
    kc: float
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Vectorized FAO-56 Penman-Monteith calculation over NumPy arrays for time-series processing.
    """
    es = 0.6108 * np.exp((17.27 * temps) / (temps + 237.3))
    ea = es * (np.clip(humidities, 5.0, 100.0) / 100.0)
    vpd = np.maximum(0.0, es - ea)
    
    delta = (4098.0 * es) / ((temps + 237.3) ** 2)
    gamma = 0.000665 * 101.3
    u2 = np.maximum(0.2, winds)
    rn = np.maximum(2.0, 0.65 * radiations_mj)
    
    rad_term = 0.408 * delta * rn
    aero_term = gamma * (900.0 / (temps + 273.15)) * u2 * vpd
    denom = delta + gamma * (1.0 + 0.34 * u2)
    
    et0 = np.clip((rad_term + aero_term) / denom, 0.5, 14.0)
    etc = np.clip(et0 * kc, 0.1, 16.0)
    
    return np.round(et0, 2), np.round(etc, 2)
