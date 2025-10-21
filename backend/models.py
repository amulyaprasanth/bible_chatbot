from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

# -----------------------------------------------------
# Pydantic Schemas
# -----------------------------------------------------


class SignInRequest(BaseModel):
    username: str  # frontend sends email here
    password: str


class SignUpRequest(BaseModel):
    name: str
    email: str
    password: str


class GoogleAuthRequest(BaseModel):
    token: str  # Google ID token


# -----------------------------------------------------
# SQLAlchemy Models
# -----------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    # Nullable for OAuth users
    password_hash = Column(String(256), nullable=True)
    auth_provider = Column(String(20), default="local",
                           nullable=False)  # local, google
    google_id = Column(String(100), unique=True,
                       nullable=True)  # Google user ID
    created_at = Column(DateTime, default=datetime.utcnow)

    # relationships
    conversations = relationship(
        "Conversation", back_populates="user", cascade="all, delete")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    title = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)
    language = Column(String, default="english")

    user = relationship("User", back_populates="conversations")
    messages = relationship(
        "Message", back_populates="conversation", cascade="all, delete")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey(
        "conversations.id", ondelete="CASCADE"))
    sender_type = Column(String(10), nullable=False)  # USER or assistant
    content = Column(Text, nullable=False)
    extra_metadata = Column(JSON)  # renamed from "metadata"
    sent_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")


class Token(BaseModel):
    token_type: str
    access_token: str


class TokenData(BaseModel):
    username: str | None


class ConvIdRequest(BaseModel):
    conv_id: int

# Request model


class CreateConversationRequest(BaseModel):
    language: str  # 'english' or 'telugu'
