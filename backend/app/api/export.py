from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.farm import Farm
from app.services.analytics_service import generate_irrigation_report_csv
from app.api.deps import get_current_user

router = APIRouter(tags=["Export"])

@router.get("/farms/{farm_id}/export/csv")
def export_farm_csv(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    csv_content = generate_irrigation_report_csv(db, farm)
    filename = f"agriflow_irrigation_report_{farm.name.replace(' ', '_').lower()}.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
