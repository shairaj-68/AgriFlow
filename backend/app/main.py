from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.session import engine, Base, SessionLocal
from app.services.crop_service import seed_default_crops
from app.services.demo_service import setup_demo_farm
import app.models  # Ensure all SQLAlchemy models are registered

# API Routers
from app.api.auth import router as auth_router
from app.api.farms import router as farms_router
from app.api.zones import router as zones_router
from app.api.crops import router as crops_router
from app.api.weather import router as weather_router
from app.api.et import router as et_router
from app.api.soil import router as soil_router
from app.api.irrigation import router as irrigation_router
from app.api.sensors import router as sensors_router
from app.api.analytics import router as analytics_router
from app.api.simulation import router as simulation_router
from app.api.export import router as export_router
from app.api.demo import router as demo_router
from app.api.predictions import router as predictions_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Create DB tables
    Base.metadata.create_all(bind=engine)
    
    # 2. Seed crops and demo farm
    db = SessionLocal()
    try:
        seed_default_crops(db)
        setup_demo_farm(db)
    except Exception as e:
        print(f"[Startup Warning] Seeding demo data: {e}")
    finally:
        db.close()
        
    yield

app = FastAPI(
    title="🌱 AgriFlow AI — Precision Agriculture API",
    description="Data-Driven Precision Agriculture & Intelligent Irrigation Management System",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routes
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(farms_router, prefix=settings.API_V1_STR)
app.include_router(zones_router, prefix=settings.API_V1_STR)
app.include_router(crops_router, prefix=settings.API_V1_STR)
app.include_router(weather_router, prefix=settings.API_V1_STR)
app.include_router(et_router, prefix=settings.API_V1_STR)
app.include_router(soil_router, prefix=settings.API_V1_STR)
app.include_router(irrigation_router, prefix=settings.API_V1_STR)
app.include_router(sensors_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(simulation_router, prefix=settings.API_V1_STR)
app.include_router(export_router, prefix=settings.API_V1_STR)
app.include_router(demo_router, prefix=settings.API_V1_STR)
app.include_router(predictions_router, prefix=settings.API_V1_STR)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "system": "🌱 AgriFlow AI",
        "version": settings.VERSION,
        "mode": "PRECISION_IRRIGATION_ENGINE"
    }
