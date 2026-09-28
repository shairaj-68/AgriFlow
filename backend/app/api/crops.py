from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.crop import Crop
from app.schemas.crop import CropCreate, CropUpdate, CropResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/crops", tags=["Crops"])

@router.get("", response_model=List[CropResponse])
def get_crops(db: Session = Depends(get_db)):
    crops = db.query(Crop).order_by(Crop.is_system.desc(), Crop.name.asc()).all()
    return crops

@router.post("", response_model=CropResponse, status_code=status.HTTP_201_CREATED)
def create_crop(
    crop_in: CropCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    existing = db.query(Crop).filter(Crop.name == crop_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Crop with this name already exists")

    crop = Crop(
        name=crop_in.name,
        description=crop_in.description,
        root_depth_min_cm=crop_in.root_depth_min_cm,
        root_depth_max_cm=crop_in.root_depth_max_cm,
        kc_seedling=crop_in.kc_seedling,
        kc_vegetative=crop_in.kc_vegetative,
        kc_flowering=crop_in.kc_flowering,
        kc_fruiting=crop_in.kc_fruiting,
        kc_maturity=crop_in.kc_maturity,
        field_capacity_pct=crop_in.field_capacity_pct,
        wilting_point_pct=crop_in.wilting_point_pct,
        critical_depletion_fraction=crop_in.critical_depletion_fraction,
        recommended_min_moisture_pct=crop_in.recommended_min_moisture_pct,
        recommended_max_moisture_pct=crop_in.recommended_max_moisture_pct,
        is_system=False
    )
    db.add(crop)
    db.commit()
    db.refresh(crop)
    return crop

@router.get("/{crop_id}", response_model=CropResponse)
def get_crop(crop_id: int, db: Session = Depends(get_db)):
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    return crop
