from sqlalchemy import Column, Integer, String
from database import Base
from pydantic import BaseModel

# SignIN Request model


class SignInRequest(BaseModel):
    username: str
    password: str

# Signup request model


class SignUpRequest(BaseModel):
    name: str
    email: str
    password: str

# Request model


class QueryRequest(BaseModel):
    language: str
    question: str
    session_id: str | None = None

# Response model


class QueryResponse(BaseModel):
    answer: str


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password = Column(String(256), nullable=False)  # store hashed password
