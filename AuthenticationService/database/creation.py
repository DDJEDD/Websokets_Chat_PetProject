from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship

from .database import Base

class Users(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    login = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    sessions = relationship("Sessions", back_populates="user", cascade="all, delete-orphan")

class Sessions(Base):
    __tablename__ = "sessions"
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    session_id = Column(String, nullable=False,primary_key=True)
    fingerprint = Column(String, nullable=False)
    user = relationship("Users", back_populates="sessions")
    expires_at = Column(DateTime(timezone=True),nullable=False,index=True)