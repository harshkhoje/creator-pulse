from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import EngagementData, User
from app.routes.auth import get_current_user
import pandas as pd
import io

router = APIRouter()

PLATFORM_COLUMN_MAPS = {
    "instagram": {
        "Date": "post_date", "Likes": "likes", "Comments": "comments",
        "Reach": "views", "Shares": "shares"
    },
    "youtube": {
        "Date": "post_date", "Views": "views", "Likes": "likes",
        "Comments": "comments", "Subscribers Gained": "subscribers_gained",
        "Subscribers Lost": "subscribers_lost", "Title": "content_title"
    },
    "newsletter": {
        "Date": "post_date",
        "Opens": "views",
        "Clicks": "likes",
        "Unsubscribes": "subscribers_lost",
        "New Subscribers": "subscribers_gained",
        "Subject": "content_title"
    },
}


@router.post("/upload/{platform}")
async def upload_csv(
    platform: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if platform not in PLATFORM_COLUMN_MAPS:
        raise HTTPException(
            status_code=400, detail=f"Unsupported platform: {platform}")
    contents = await file.read()
    df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    col_map = PLATFORM_COLUMN_MAPS[platform]
    df = df.rename(
        columns={k: v for k, v in col_map.items() if k in df.columns})
    df["post_date"] = pd.to_datetime(df["post_date"], errors="coerce")
    df = df.dropna(subset=["post_date"])
    records = []
    for _, row in df.iterrows():
        record = EngagementData(
            user_id=current_user.id,
            platform=platform,
            post_date=row.get("post_date"),
            likes=row.get("likes", 0),
            comments=row.get("comments", 0),
            shares=row.get("shares", 0),
            views=row.get("views", 0),
            subscribers_gained=row.get("subscribers_gained", 0),
            subscribers_lost=row.get("subscribers_lost", 0),
            content_title=row.get("content_title", None),
        )
        records.append(record)
    db.bulk_save_objects(records)
    db.commit()
    return {"message": f"Uploaded {len(records)} records for {platform}"}
