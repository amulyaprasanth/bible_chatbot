from pydantic import BaseModel
from sqlalchemy import Column, Integer, String
from database import Base

# --- Request models ---
# Login request — username is actually email
class SignInRequest(BaseModel):
    username: str  # frontend sends email here
    password: str

# Signup request — frontend sends name, email, password
class SignUpRequest(BaseModel):
    name: str
    email: str
    password: str

# --- SQLAlchemy User model ---
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password = Column(String(256), nullable=False)  # bcrypt hash
