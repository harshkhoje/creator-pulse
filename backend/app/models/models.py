from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    uploads = relationship("EngagementData", back_populates="owner")


class EngagementData(Base):
    __tablename__ = "engagement_data"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    platform = Column(String)
    post_date = Column(DateTime)
    likes = Column(Float, default=0)
    comments = Column(Float, default=0)
    shares = Column(Float, default=0)
    views = Column(Float, default=0)
    subscribers_gained = Column(Float, default=0)
    subscribers_lost = Column(Float, default=0)
    content_title = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    owner = relationship("User", back_populates="uploads")
