import datetime
from fastapi import Depends, APIRouter
import jwt
from jwt import InvalidTokenError
from google.oauth2 import id_token

from google.auth.transport.requests import Request
from fastapi.security import OAuth2PasswordBearer
import os
from db import get_db
from models import GoogleLoginRequest, GoogleTokenRequest, GoogleTokenResponse, User
from dotenv import load_dotenv
import requests
load_dotenv()

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer("/token")

CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
AUTH_URI = os.getenv("GOOGLE_AUTH_URI")
TOKEN_URI = os.getenv("GOOGLE_TOKEN_URI")
REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"


def create_access_token(data: dict, expires_delta: datetime.timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.now(datetime.UTC) + expires_delta
    else:
        expire = datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/google")
async def google_login(login_request: GoogleLoginRequest, db=Depends(get_db)):
    token_data = GoogleTokenRequest(
        code=login_request.code,
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        redirect_uri=[REDIRECT_URI],
        grant_type="authorization_code"
    )

    response_json = requests.post(
        TOKEN_URI, data=token_data.model_dump()).json()

    token_response = GoogleTokenResponse(**response_json)

    # 1. verify google token
    id_info = id_token.verify_oauth2_token(
        token_response.id_token, Request(), CLIENT_ID)

    # 2️. Extract user info from token
    user_email = id_info["email"]
    user_id = id_info["sub"]
    user_name = id_info.get("name", "User")
    profile_picture = id_info.get("picture")
    locale = id_info.get("locale")

    # if user doesn't exist, add to db
    user = db.query(User).filter(User.email == user_email).first()

    if not user:
        user = User(
            name=user_name,
            email=user_email,
            google_id=user_id,
            auth_provider="google",
            profile_picture=profile_picture,
            locale=locale
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # return to frontend
    return {
        "access_token": create_access_token(data={"sub": user.id}),
        "token_type": "bearer"
    }
