from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.demo_service import setup_demo_farm, DEMO_USER_EMAIL, DEMO_USER_PASSWORD
from app.core.security import create_access_token
from app.schemas.auth import TokenResponse

router = APIRouter(prefix="/demo", tags=["Demo Mode"])

@router.post("/load", response_model=TokenResponse)
def load_demo(db: Session = Depends(get_db)):
    user, farm = setup_demo_farm(db)
    token = create_access_token(subject=user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }
