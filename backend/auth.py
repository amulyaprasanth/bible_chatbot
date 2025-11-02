import datetime
import os
import requests
import jwt
from jwt import InvalidTokenError, ExpiredSignatureError
from fastapi import Depends, APIRouter, HTTPException, status, Request, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import JSONResponse
from google.oauth2 import id_token
from google.auth.transport.requests import Request as GoogleRequest
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from dotenv import load_dotenv
import logging
from typing import Optional

from db import get_db
from models import (
    GoogleLoginRequest,
    GoogleTokenRequest,
    GoogleTokenResponse,
    User,
)

load_dotenv()

# === SETUP ===
logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

# === CONFIGS ===
CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
TOKEN_URI = os.getenv("GOOGLE_TOKEN_URI",
                      "https://oauth2.googleapis.com/token")
REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
GOOGLE_TOKEN_BUFFER_MINUTES = int(
    # Refresh 5 min before expiry
    os.getenv("GOOGLE_TOKEN_BUFFER_MINUTES", "5"))

# === VALIDATE ENV VARS ===
required_env_vars = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "SECRET_KEY"]
missing_vars = [var for var in required_env_vars if not os.getenv(var)]
if missing_vars:
    raise RuntimeError(
        f"Missing required environment variables: {missing_vars}")

# === CONSTANTS ===
ERROR_INVALID_TOKEN_PAYLOAD = "Invalid token payload"
ERROR_INVALID_TOKEN_SCOPE = "Invalid token scope"
ERROR_INVALID_TOKEN_MISSING_SUBJECT = "Invalid token: missing subject"

# === TOKEN HELPERS ===


def create_access_token(data: dict):
    expire = datetime.datetime.now(
        datetime.UTC) + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {**data, "exp": expire,
                 "scope": "access_token", "type": "access"}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict):
    expire = datetime.datetime.now(
        datetime.UTC) + datetime.timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {**data, "exp": expire,
                 "scope": "refresh_token", "type": "refresh"}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def validate_token_payload(payload: dict) -> bool:
    """Validate JWT payload has required fields"""
    required_fields = {"sub", "exp", "scope", "type"}
    return all(field in payload for field in required_fields)


def get_current_user(request: Request, db: Session = Depends(get_db)):
    """Extract and validate the current user from cookies."""
    token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="No access token provided")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        if not validate_token_payload(payload):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail=ERROR_INVALID_TOKEN_PAYLOAD)

        if payload.get("scope") != "access_token" or payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail=ERROR_INVALID_TOKEN_SCOPE)

        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                detail=ERROR_INVALID_TOKEN_MISSING_SUBJECT)

    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Access token expired")
    except InvalidTokenError as e:
        logger.warning(f"Invalid token attempt: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logger.warning(f"User not found for ID: {user_id}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return user

# === GOOGLE TOKEN MANAGEMENT ===


def refresh_google_tokens(user: User, db: Session) -> bool:
    """Refresh Google OAuth tokens for a user"""
    if not user.google_refresh_token:
        logger.warning(f"No Google refresh token for user {user.id}")
        return False

    try:
        data = {
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "refresh_token": user.google_refresh_token,
            "grant_type": "refresh_token",
        }

        response = requests.post(TOKEN_URI, data=data, timeout=30)
        response.raise_for_status()
        tokens = response.json()

        # Update user with new tokens
        user.google_access_token = tokens.get("access_token")

        # Calculate expiry (Google access tokens typically last 1 hour)
        if "expires_in" in tokens:
            # Store as timezone-aware to match database TIMESTAMP(timezone=True)
            expiry_time = datetime.datetime.now(
                datetime.UTC) + datetime.timedelta(seconds=tokens["expires_in"])
            user.google_token_expiry = expiry_time

        db.commit()
        logger.info(f"Google tokens refreshed for user {user.id}")
        return True

    except requests.RequestException as e:
        logger.error(
            f"Failed to refresh Google tokens for user {user.id}: {str(e)}")
        return False
    except Exception as e:
        logger.error(
            f"Unexpected error refreshing Google tokens for user {user.id}: {str(e)}")
        db.rollback()
        return False


def is_google_token_expired(user: User) -> bool:
    """Check if Google token is expired or about to expire"""
    if not user.google_token_expiry:
        return True

    buffer_time = datetime.timedelta(minutes=GOOGLE_TOKEN_BUFFER_MINUTES)
    # Use timezone-aware datetime to match database TIMESTAMP(timezone=True)
    current_time = datetime.datetime.now(datetime.UTC)
    return current_time >= (user.google_token_expiry - buffer_time)


def ensure_valid_google_tokens(user: User, db: Session) -> bool:
    """Ensure Google tokens are valid, refresh if needed"""
    if not user.google_refresh_token:
        return False

    if is_google_token_expired(user):
        return refresh_google_tokens(user, db)

    return True

# === GOOGLE LOGIN ===


@router.post("/google", status_code=status.HTTP_200_OK)
async def google_login(login_request: GoogleLoginRequest, db: Session = Depends(get_db)):
    """Login or register via Google OAuth"""
    if not login_request.code or len(login_request.code) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid authorization code"
        )

    token_data = GoogleTokenRequest(
        code=login_request.code,
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        redirect_uri=REDIRECT_URI,
        grant_type="authorization_code"
    )

    try:
        # Exchange code for tokens
        response = requests.post(
            TOKEN_URI, data=token_data.model_dump(), timeout=30)
        response.raise_for_status()
        response_json = response.json()

        if "error" in response_json:
            error_msg = response_json.get(
                "error_description", "Google login failed")
            logger.error(f"Google token error: {error_msg}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Authentication failed"
            )

        token_response = GoogleTokenResponse(**response_json)

        # Verify ID token
        id_info = id_token.verify_oauth2_token(
            token_response.id_token, GoogleRequest(), CLIENT_ID
        )

        if id_info["iss"] not in ["accounts.google.com", "https://accounts.google.com"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token issuer"
            )

        email = id_info["email"]
        google_id = id_info["sub"]
        name = id_info.get("name", "User")
        picture = id_info.get("picture", "")

        # Find or create user
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                name=name,
                email=email,
                google_id=google_id,
                auth_provider="google",
                profile_picture=picture,
            )
            db.add(user)
            try:
                db.commit()
                db.refresh(user)
                logger.info(f"New user created: {email}")
            except IntegrityError:
                db.rollback()
                # User might have been created by another process, try to fetch again
                user = db.query(User).filter(User.email == email).first()
                if not user:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Failed to create user"
                    )

        # Update user with latest Google tokens
        user.google_access_token = token_response.access_token
        user.google_refresh_token = token_response.refresh_token

        # Set Google token expiry (typically 1 hour)
        if token_response.expires_in:
            # Store as timezone-aware to match database TIMESTAMP(timezone=True)
            expiry_time = datetime.datetime.now(
                datetime.UTC) + datetime.timedelta(seconds=token_response.expires_in)
            user.google_token_expiry = expiry_time

        db.commit()

        # Create app tokens
        access_token = create_access_token({"sub": str(user.id)})
        refresh_token = create_refresh_token({"sub": str(user.id)})

        response = JSONResponse(
            content={
                "message": "Login successful",
                "user": {
                    "id": str(user.id),
                    "name": user.name,
                    "email": user.email,
                    "profile_picture": user.profile_picture
                }
            }
        )

        # Set cookies
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=True,
            samesite="None",
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            path="/"
        )
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,
            samesite="None",
            max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
            path="/"
        )

        return response

    except requests.RequestException as e:
        logger.error(f"Google token exchange failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authentication service unavailable"
        )
    except ValueError as e:
        logger.error(f"Google ID token verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid authentication token"
        )
    except Exception as e:
        logger.error(f"Unexpected error during Google login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during authentication"
        )

# === REFRESH YOUR OWN APP TOKEN ===


@router.post("/refresh", status_code=status.HTTP_200_OK)
def refresh_token(request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Refresh app-level JWT using stored refresh cookie"""
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token provided"
        )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        if not validate_token_payload(payload):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail=ERROR_INVALID_TOKEN_PAYLOAD)

        if payload.get("scope") != "refresh_token" or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail=ERROR_INVALID_TOKEN_SCOPE)

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                detail=ERROR_INVALID_TOKEN_MISSING_SUBJECT)

        # Optionally refresh Google tokens in background
        user = db.query(User).filter(User.id == user_id).first()
        if user and user.google_refresh_token:
            background_tasks.add_task(ensure_valid_google_tokens, user, db)

        new_access_token = create_access_token({"sub": user_id})
        response = JSONResponse(content={"message": "Access token refreshed"})
        response.set_cookie(
            key="access_token",
            value=new_access_token,
            httponly=True,
            secure=True,
            samesite="None",
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            path="/"
        )
        return response

    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired"
        )
    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )


def _attempt_token_refresh(refresh_token: str, db: Session) -> JSONResponse:
    """Helper to refresh access token from refresh token"""
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])

        if not validate_token_payload(payload):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail=ERROR_INVALID_TOKEN_PAYLOAD)

        if payload.get("scope") != "refresh_token" or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail=ERROR_INVALID_TOKEN_SCOPE)

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                detail=ERROR_INVALID_TOKEN_MISSING_SUBJECT)

        # Refresh Google tokens if needed
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            ensure_valid_google_tokens(user, db)

        new_access_token = create_access_token({"sub": user_id})
        response = JSONResponse(
            content={"authenticated": True, "refreshed": True})
        response.set_cookie(
            key="access_token",
            value=new_access_token,
            httponly=True,
            secure=True,
            samesite="None",
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            path="/"
        )
        return response

    except (ExpiredSignatureError, InvalidTokenError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired, please login again"
        )

# === CHECK LOGIN STATE (AUTO REFRESH ON EXPIRED) ===


@router.get("/check")
def check_auth(request: Request, db: Session = Depends(get_db)):
    """Check if user is authenticated; auto-refresh if access expired"""
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No access token provided"
        )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        # Token is valid, check Google tokens if user exists
        user_id = payload.get("sub")
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                ensure_valid_google_tokens(user, db)

        return {"authenticated": True, "refreshed": False}

    except ExpiredSignatureError:
        # Try to refresh token silently
        refresh_token = request.cookies.get("refresh_token")
        if not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired"
            )
        return _attempt_token_refresh(refresh_token, db)

    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token"
        )

# === REFRESH GOOGLE TOKEN ===


@router.post("/google/refresh", status_code=status.HTTP_200_OK)
def refresh_google_token(request: Request, db: Session = Depends(get_db)):
    """Refresh Google OAuth tokens using stored Google refresh token"""
    user = get_current_user(request, db)

    if not user.google_refresh_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No Google refresh token available"
        )

    success = refresh_google_tokens(user, db)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to refresh Google tokens"
        )

    return {
        "message": "Google tokens refreshed successfully",
        "google_access_token": user.google_access_token,
        "expires_at": user.google_token_expiry.isoformat() if user.google_token_expiry else None
    }

# === GET CURRENT USER ===


@router.get("/user")
def get_user(user: User = Depends(get_current_user)):
    """Return the currently authenticated user's details."""
    return {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "profile_picture": user.profile_picture,
        "auth_provider": user.auth_provider
    }

# === LOGOUT ===


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout():
    """Delete cookies and logout"""
    response = JSONResponse(content={"message": "Logged out successfully"})

    # Must match the attributes used when setting cookies
    response.delete_cookie(
        key="access_token",
        path="/",
        secure=True,
        httponly=True,
        samesite="None"
    )
    response.delete_cookie(
        key="refresh_token",
        path="/",
        secure=True,
        httponly=True,
        samesite="None"
    )

    return response


# === HEALTH CHECK ===


@router.get("/health")
def health_check():
    """Authentication service health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
        "features": {
            "google_oauth": bool(CLIENT_ID and CLIENT_SECRET),
            "token_refresh": True,
            "auto_refresh": True
        }
    }
