import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from app.models.models import EngagementData


def get_user_dataframe(user_id: int, db: Session, platform: str = None):
    query = db.query(EngagementData).filter(EngagementData.user_id == user_id)
    if platform:
        query = query.filter(EngagementData.platform == platform)
    records = query.order_by(EngagementData.post_date).all()
    if not records:
        return pd.DataFrame()
    return pd.DataFrame([{
        "post_date": r.post_date, "platform": r.platform,
        "likes": r.likes, "comments": r.comments, "shares": r.shares,
        "views": r.views, "subscribers_gained": r.subscribers_gained,
        "subscribers_lost": r.subscribers_lost, "content_title": r.content_title
    } for r in records])


def compute_engagement_score(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["engagement_score"] = (
        df["likes"] * 1.0 + df["comments"] * 2.0 + df["shares"] * 3.0)
    df["engagement_rate"] = df["engagement_score"] / \
        df["views"].replace(0, np.nan)
    return df


def retention_trend(df: pd.DataFrame, window: int = 7) -> pd.DataFrame:
    df = compute_engagement_score(df).sort_values("post_date")
    df["rolling_engagement"] = df["engagement_score"].rolling(
        window=window, min_periods=1).mean()
    return df[["post_date", "platform", "engagement_score", "rolling_engagement", "content_title"]]


def churn_risk_score(df: pd.DataFrame) -> dict:
    if df.empty or len(df) < 3:
        return {"score": 0, "label": "Insufficient data", "reason": "Upload more data to get a churn score."}
    df = compute_engagement_score(df).sort_values("post_date")
    recent = df.tail(5)["engagement_score"]
    older = df.head(max(5, len(df) - 5))["engagement_score"]
    recent_mean = recent.mean()
    older_mean = older.mean() if len(older) > 0 else recent_mean
    if older_mean == 0:
        return {"score": 0, "label": "No baseline", "reason": "Baseline engagement is zero."}
    decay = (older_mean - recent_mean) / older_mean
    volatility = df["engagement_score"].std(
    ) / (df["engagement_score"].mean() + 1e-9)
    score = round(min(100, max(0, (decay * 60 + volatility * 40) * 100)), 1)
    if score < 25:
        label, reason = "Low Risk", "Your engagement is stable or growing."
    elif score < 55:
        label, reason = "Medium Risk", "Some recent dip — monitor closely."
    else:
        label, reason = "High Risk", "Significant engagement decline detected."
    return {"score": score, "label": label, "reason": reason}


def content_fatigue(df: pd.DataFrame) -> dict:
    if len(df) < 5:
        return {"fatigue_detected": False, "message": "Not enough data to detect fatigue."}
    df = compute_engagement_score(df).sort_values(
        "post_date").reset_index(drop=True)
    df["marginal_gain"] = df["engagement_score"].diff()
    recent_marginal = df["marginal_gain"].tail(5).mean()
    fatigue = recent_marginal < 0
    return {
        "fatigue_detected": bool(fatigue),
        "recent_marginal_engagement": round(recent_marginal, 2),
        "message": "Content fatigue detected — engagement declining per post." if fatigue else "No fatigue detected. Keep it up!"
    }


def forecast_next_period(df: pd.DataFrame, periods: int = 4) -> list:
    if len(df) < 5:
        return []
    df = compute_engagement_score(df).sort_values("post_date")
    scores = df["engagement_score"].values
    x = np.arange(len(scores))
    slope, intercept = np.polyfit(x, scores, 1)
    future = [max(0, intercept + slope * (len(scores) + i))
              for i in range(1, periods + 1)]
    return [round(v, 2) for v in future]
