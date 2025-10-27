from sqlalchemy import Column, BigInteger, ForeignKey, Integer, String, Boolean, TIMESTAMP, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db import Base
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# ----------------------------------------------------
# Database Models
# ----------------------------------------------------


class User(Base):
    __tablename__ = "users"

    # ... your existing fields ...
    id = Column(BigInteger, primary_key=True, autoincrement=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    google_id = Column(String(100), unique=True)
    auth_provider = Column(String(20), nullable=False, default="google")
    profile_picture = Column(String(512))
    email_verified = Column(Boolean, default=True)
    locale = Column(String(10))
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(),
                        onupdate=func.now(), nullable=False)
    google_refresh_token = Column(
        String, nullable=True)  # You already have this

    # === ADD THESE TWO NEW FIELDS ===
    # NEW: Store Google access token
    google_access_token = Column(String, nullable=True)
    # NEW: Track when token expires
    google_token_expiry = Column(TIMESTAMP, nullable=True)

    # ... your relationships ...
    conversations = relationship(
        "Conversation", back_populates="user", cascade="all, delete"
    )


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"))
    title = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(),
                        onupdate=func.now(), nullable=False)
    language = Column(String(10), nullable=False, default="english")

    # Relationships
    user = relationship("User", back_populates="conversations")
    messages = relationship(
        "Message", back_populates="conversation", cascade="all, delete")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey(
        "conversations.id", ondelete="CASCADE"))
    sender_type = Column(String(10), nullable=False)
    content = Column(Text, nullable=False)
    sent_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)

    # Relationship back to Conversation
    conversation = relationship("Conversation", back_populates="messages")


# ----------------------------------------------------
# Request Models
# ----------------------------------------------------
class GoogleLoginRequest(BaseModel):
    code: str
    scope: str
    authuser: str
    prompt: str


class GoogleTokenRequest(BaseModel):
    code: str
    client_id: str
    client_secret: str
    redirect_uri: str
    grant_type: str = "authorization_code"


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    profile_picture: Optional[str] = None
    email_verified: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Update your GoogleTokenResponse to handle optional refresh token


class GoogleTokenResponse(BaseModel):
    access_token: str
    expires_in: int
    refresh_token: Optional[str] = None  # Make this optional
    scope: str
    token_type: str
    id_token: str
