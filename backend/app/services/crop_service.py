from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.crop import Crop

DEFAULT_CROPS = [
    {
        "name": "Tomato",
        "description": "High-value horticultural crop sensitive to water stress during flowering and fruit development.",
        "root_depth_min_cm": 30.0,
        "root_depth_max_cm": 80.0,
        "kc_seedling": 0.45,
        "kc_vegetative": 0.75,
        "kc_flowering": 1.15,
        "kc_fruiting": 1.10,
        "kc_maturity": 0.80,
        "field_capacity_pct": 32.0,
        "wilting_point_pct": 14.0,
        "critical_depletion_fraction": 0.40,
        "recommended_min_moisture_pct": 40.0,
        "recommended_max_moisture_pct": 70.0,
    },
    {
        "name": "Wheat",
        "description": "Cereal grain crop with key irrigation stages at crown root initiation, flowering, and grain filling.",
        "root_depth_min_cm": 30.0,
        "root_depth_max_cm": 110.0,
        "kc_seedling": 0.35,
        "kc_vegetative": 0.70,
        "kc_flowering": 1.15,
        "kc_fruiting": 1.05,
        "kc_maturity": 0.40,
        "field_capacity_pct": 30.0,
        "wilting_point_pct": 12.0,
        "critical_depletion_fraction": 0.55,
        "recommended_min_moisture_pct": 35.0,
        "recommended_max_moisture_pct": 65.0,
    },
    {
        "name": "Rice",
        "description": "Semi-aquatic cereal requiring continuous saturation or alternate wetting and drying (AWD) water management.",
        "root_depth_min_cm": 20.0,
        "root_depth_max_cm": 60.0,
        "kc_seedling": 1.05,
        "kc_vegetative": 1.10,
        "kc_flowering": 1.25,
        "kc_fruiting": 1.20,
        "kc_maturity": 0.90,
        "field_capacity_pct": 40.0,
        "wilting_point_pct": 18.0,
        "critical_depletion_fraction": 0.20,
        "recommended_min_moisture_pct": 60.0,
        "recommended_max_moisture_pct": 95.0,
    },
    {
        "name": "Maize",
        "description": "Corn crop with high water demand during silking and tasseling stages.",
        "root_depth_min_cm": 30.0,
        "root_depth_max_cm": 100.0,
        "kc_seedling": 0.40,
        "kc_vegetative": 0.80,
        "kc_flowering": 1.20,
        "kc_fruiting": 1.15,
        "kc_maturity": 0.60,
        "field_capacity_pct": 30.0,
        "wilting_point_pct": 13.0,
        "critical_depletion_fraction": 0.55,
        "recommended_min_moisture_pct": 35.0,
        "recommended_max_moisture_pct": 70.0,
    },
    {
        "name": "Cotton",
        "description": "Deep-rooted fiber crop sensitive to waterlogging and moisture deficit during boll formation.",
        "root_depth_min_cm": 40.0,
        "root_depth_max_cm": 120.0,
        "kc_seedling": 0.35,
        "kc_vegetative": 0.75,
        "kc_flowering": 1.20,
        "kc_fruiting": 1.15,
        "kc_maturity": 0.65,
        "field_capacity_pct": 32.0,
        "wilting_point_pct": 15.0,
        "critical_depletion_fraction": 0.60,
        "recommended_min_moisture_pct": 30.0,
        "recommended_max_moisture_pct": 65.0,
    },
    {
        "name": "Groundnut",
        "description": "Legume oilseed crop requiring adequate moisture during flowering and pegging stages.",
        "root_depth_min_cm": 25.0,
        "root_depth_max_cm": 80.0,
        "kc_seedling": 0.40,
        "kc_vegetative": 0.70,
        "kc_flowering": 1.10,
        "kc_fruiting": 1.05,
        "kc_maturity": 0.60,
        "field_capacity_pct": 28.0,
        "wilting_point_pct": 11.0,
        "critical_depletion_fraction": 0.50,
        "recommended_min_moisture_pct": 35.0,
        "recommended_max_moisture_pct": 65.0,
    },
    {
        "name": "Sugarcane",
        "description": "Long-duration perennial grass with extensive water requirement during tillering and grand growth.",
        "root_depth_min_cm": 40.0,
        "root_depth_max_cm": 130.0,
        "kc_seedling": 0.40,
        "kc_vegetative": 0.85,
        "kc_flowering": 1.25,
        "kc_fruiting": 1.20,
        "kc_maturity": 0.75,
        "field_capacity_pct": 34.0,
        "wilting_point_pct": 16.0,
        "critical_depletion_fraction": 0.65,
        "recommended_min_moisture_pct": 40.0,
        "recommended_max_moisture_pct": 75.0,
    },
    {
        "name": "Banana",
        "description": "High water-consuming tropical crop with shallow root system, requiring frequent light irrigation.",
        "root_depth_min_cm": 30.0,
        "root_depth_max_cm": 70.0,
        "kc_seedling": 0.50,
        "kc_vegetative": 0.90,
        "kc_flowering": 1.20,
        "kc_fruiting": 1.15,
        "kc_maturity": 1.00,
        "field_capacity_pct": 35.0,
        "wilting_point_pct": 16.0,
        "critical_depletion_fraction": 0.35,
        "recommended_min_moisture_pct": 45.0,
        "recommended_max_moisture_pct": 80.0,
    }
]

def seed_default_crops(db: Session):
    for crop_data in DEFAULT_CROPS:
        existing = db.query(Crop).filter(Crop.name == crop_data["name"]).first()
        if not existing:
            crop = Crop(**crop_data, is_system=True)
            db.add(crop)
    db.commit()

def get_crop_kc(crop: Crop, growth_stage: str) -> float:
    stage_lower = growth_stage.lower()
    if "seedling" in stage_lower or "initial" in stage_lower:
        return crop.kc_seedling
    elif "vegetative" in stage_lower or "development" in stage_lower:
        return crop.kc_vegetative
    elif "flowering" in stage_lower or "mid" in stage_lower:
        return crop.kc_flowering
    elif "fruiting" in stage_lower or "late" in stage_lower:
        return crop.kc_fruiting
    elif "maturity" in stage_lower or "end" in stage_lower:
        return crop.kc_maturity
    return crop.kc_flowering
