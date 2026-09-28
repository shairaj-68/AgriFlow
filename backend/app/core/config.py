from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "AgriFlow AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = Field(
        default="sqlite:///./agriflow.db",
        description="PostgreSQL or SQLite connection string"
    )
    
    # Security
    JWT_SECRET: str = "agriflow_precision_agriculture_super_secret_key_2026_x7890"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Weather API
    OPEN_METEO_BASE_URL: str = "https://api.open-meteo.com/v1"
    WEATHER_CACHE_TTL_MINUTES: int = 20
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
