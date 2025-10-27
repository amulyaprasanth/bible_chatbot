import datetime
from fastapi import Depends, APIRouter, HTTPException, status
from google.oauth2 import id_token
from google.auth.transport.requests import Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import os
import requests
import jwt
from jwt import InvalidTokenError

from db import get_db
from models import (
    GoogleLoginRequest,
    GoogleTokenRequest,
    GoogleTokenResponse,
    User,
)
from dotenv import load_dotenv
from fastapi.responses import JSONResponse
load_dotenv()

router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

# Google OAuth configs
CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
AUTH_URI = os.getenv("GOOGLE_AUTH_URI")
TOKEN_URI = os.getenv("GOOGLE_TOKEN_URI")
REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")

# JWT configs
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7


def create_access_token(data: dict):
    """Short-lived token for API access"""
    to_encode = data.copy()
    expire = datetime.datetime.now(
        datetime.UTC) + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "scope": "access_token"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict):
    """Long-lived token for refreshing access"""
    to_encode = data.copy()
    expire = datetime.datetime.now(
        datetime.UTC) + datetime.timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "scope": "refresh_token"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/google")
async def google_login(login_request: GoogleLoginRequest, db=Depends(get_db)):
    token_data = GoogleTokenRequest(
        code=login_request.code,
        client_id=os.getenv("GOOGLE_CLIENT_ID"),
        client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
        redirect_uri=os.getenv("GOOGLE_REDIRECT_URI"),
        grant_type="authorization_code"
    )
    response_json = requests.post(
        os.getenv("GOOGLE_TOKEN_URI"), data=token_data.model_dump()).json()
    token_response = GoogleTokenResponse(**response_json)

    id_info = id_token.verify_oauth2_token(
        token_response.id_token, Request(), os.getenv("GOOGLE_CLIENT_ID"))
    user_email = id_info["email"]
    user_id = id_info["sub"]
    user_name = id_info.get("name", "User")

    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        user = User(name=user_name, email=user_email,
                    google_id=user_id, auth_provider="google")
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    response = JSONResponse(content={"message": "Login successful"})
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="Lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="Lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600
    )
    return response


@router.post("/refresh")
def refresh_token(request: Request):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token")

    try:
        payload = id_token.verify_token(refresh_token, refresh=True)
        user_id = payload.get("sub")
    except HTTPException as e:
        raise HTTPException(status_code=401, detail=str(e.detail))

    new_access_token = create_access_token({"sub": user_id})
    response = JSONResponse(content={"message": "Token refreshed"})
    response.set_cookie(
        key="access_token",
        value=new_access_token,
        httponly=True,
        secure=True,
        samesite="Lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    return response


@router.get("/check")
def check_auth(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="No access token")

    try:
        id_token.verify_token(token)
        return {"authenticated": True}
    except HTTPException as e:
        if e.detail == "Token expired":
            raise HTTPException(status_code=401, detail="expired")
        raise
