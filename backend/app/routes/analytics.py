from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User
from app.routes.auth import get_current_user
from app.services import analytics as svc

router = APIRouter()


@router.get("/retention")
def get_retention(platform: str = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    df = svc.get_user_dataframe(user.id, db, platform)
    if df.empty:
        return {"data": []}
    trend = svc.retention_trend(df)
    return {"data": trend.to_dict(orient="records")}


@router.get("/churn-risk")
def get_churn_risk(platform: str = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    df = svc.get_user_dataframe(user.id, db, platform)
    return svc.churn_risk_score(df)


@router.get("/content-fatigue")
def get_fatigue(platform: str = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    df = svc.get_user_dataframe(user.id, db, platform)
    return svc.content_fatigue(df)


@router.get("/forecast")
def get_forecast(platform: str = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    df = svc.get_user_dataframe(user.id, db, platform)
    return {"forecast": svc.forecast_next_period(df)}
