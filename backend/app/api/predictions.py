from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.farm import Farm
from app.models.farm_zone import FarmZone
from app.schemas.ml_prediction import (
    FarmMLPredictionOverview,
    ZoneMLPredictionResponse
)
from app.services.ml_pipeline import run_ml_pipeline_for_farm, run_ml_pipeline_for_zone
from app.api.deps import get_current_user

router = APIRouter(tags=["AI Prediction Studio & ML Pipeline"])

@router.get("/farms/{farm_id}/predictions", response_model=FarmMLPredictionOverview)
async def get_farm_predictions(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Executes the 3-Stage Machine Learning Pipeline (Features -> Model 1 & 2 -> Model 3)
    for all zones within the farm.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    predictions = await run_ml_pipeline_for_farm(db, farm)
    return predictions

@router.get("/zones/{zone_id}/predictions", response_model=ZoneMLPredictionResponse)
async def get_zone_predictions(
    zone_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves deep-dive ML predictions, feature importances, and 7-day trajectories
    for a specific farm zone.
    """
    zone = db.query(FarmZone).join(Farm).filter(
        FarmZone.id == zone_id,
        Farm.user_id == current_user.id
    ).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    prediction = await run_ml_pipeline_for_zone(db, zone)
    return prediction

@router.get("/predictions/architecture")
def get_ml_architecture():
    """
    Returns the live topology and metadata of the multi-stage ML prediction pipeline.
    """
    return {
        "pipeline_name": "AgriFlow Hierarchical Precision ML Pipeline",
        "stages": [
            {
                "stage": 1,
                "name": "Atmospheric Ingestion",
                "inputs": ["Temperature", "Relative Humidity", "Wind Speed", "Solar Radiation", "Rainfall"],
                "source": "Open-Meteo High-Resolution Numerical Model"
            },
            {
                "stage": 2,
                "name": "Agronomic Feature Engineering",
                "engineered_features": [
                    "Vapor Pressure Deficit (VPD)",
                    "Net Radiation (Rn)",
                    "Reference ET0 (FAO-56)",
                    "Crop Transpiration Demand (ETc = ET0 * Kc)",
                    "Readily Available Water (RAW = p * TAW)",
                    "Soil Moisture Depletion Fraction",
                    "3-Day & 7-Day Precipitation Lookahead Trends"
                ]
            },
            {
                "stage": 3,
                "name": "Parallel Predictive Core",
                "models": [
                    {
                        "model_id": "model_1_et",
                        "name": "Model 1: Atmospheric ET Forecaster",
                        "objective": "Predict next 1-7 days ET0 and ETc loss rates with 90% confidence bands"
                    },
                    {
                        "model_id": "model_2_soil",
                        "name": "Model 2: Root-Zone Soil Moisture Forecaster",
                        "objective": "Predict 7-day soil water storage trajectory and stress breach day"
                    }
                ]
            },
            {
                "stage": 4,
                "name": "Ensemble Synthesis Core",
                "models": [
                    {
                        "model_id": "model_3_irrigation",
                        "name": "Model 3: Predictive Irrigation Decision & Volume Synthesizer",
                        "objective": "Fuse Model 1 + Model 2 to output probability %, gross depth mm, volume L, and pump duration min"
                    }
                ]
            },
            {
                "stage": 5,
                "name": "Decision Delivery & Explainability",
                "targets": ["Dashboard Live Inference", "Command Center", "Irrigation Automation Triggers"]
            }
        ],
        "status": "OPERATIONAL",
        "provenance": "PREDICTED"
    }
