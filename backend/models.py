from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, ConfigDict

from sqlalchemy import (
    String,
    Boolean,
    ForeignKey,
    Text,
    func,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from sqlalchemy.types import TIMESTAMP, BigInteger, Integer

from db import Base


# ----------------------------------------------------
# Database Models
# ----------------------------------------------------


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    google_id: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )

    auth_provider: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="google",
    )

    profile_picture: Mapped[Optional[str]] = mapped_column(
        String(512),
        nullable=True,
    )

    email_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    locale: Mapped[Optional[str]] = mapped_column(
        String(10),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Google OAuth tokens

    google_access_token: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    google_refresh_token: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    google_token_expiry: Mapped[Optional[datetime]] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True,
    )

    # Relationships

    conversations: Mapped[List["Conversation"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="noload",
    )


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    language: Mapped[str] = mapped_column(
        String(10),
        default="english",
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships

    user: Mapped["User"] = relationship(
        back_populates="conversations",
        lazy="noload",
    )

    messages: Mapped[List["Message"]] = relationship(
        back_populates="conversation",
        cascade="all, delete-orphan",
        lazy="noload",
    )


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    conversation_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    sender_type: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    sent_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships

    conversation: Mapped["Conversation"] = relationship(
        back_populates="messages",
        lazy="noload",
    )


# ----------------------------------------------------
# Pydantic Schemas
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


class GoogleTokenResponse(BaseModel):
    access_token: str
    expires_in: int
    refresh_token: Optional[str] = None
    scope: str
    token_type: str
    id_token: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    profile_picture: Optional[str] = None
    email_verified: bool
    created_at: datetime
    updated_at: datetime


class AgentQueryRequest(BaseModel):
    conv_id: int
    query: str


class AgentQueryResponse(BaseModel):
    conv_id: int
    sender_type: str
    content: str
    title: str
