from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.farm import Farm
from app.schemas.analytics import AnalyticsOverview
from app.services.analytics_service import calculate_farm_analytics
from app.api.deps import get_current_user

router = APIRouter(tags=["Analytics"])

@router.get("/farms/{farm_id}/analytics", response_model=AnalyticsOverview)
def get_farm_analytics(
    farm_id: int,
    range: str = Query("30d", description="Time range: 7d, 30d, 90d"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    days_map = {"7d": 7, "30d": 30, "90d": 90}
    days = days_map.get(range.lower(), 30)

    data = calculate_farm_analytics(db=db, farm=farm, days_range=days)
    return data
