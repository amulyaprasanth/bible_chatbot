import sys
import datetime
import os
import jwt
from jwt import InvalidTokenError, ExpiredSignatureError
from fastapi import Depends, APIRouter, HTTPException, status, Request, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import JSONResponse
from google.oauth2 import id_token
from google.auth.transport.requests import Request as GoogleRequest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx
from sqlalchemy.exc import IntegrityError
import certifi
from dotenv import load_dotenv
import logging
from typing import Annotated

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


def _http_client() -> httpx.AsyncClient:
    """Use certifi on Windows (Python doesn't use system store by default).
    On Linux/Railway the system CA bundle is correct so we use the default."""
    verify: bool | str = certifi.where() if sys.platform == "win32" else True
    return httpx.AsyncClient(verify=verify, timeout=30)


# === CONFIGS ===
CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
TOKEN_URI = os.getenv("GOOGLE_TOKEN_URI", "https://oauth2.googleapis.com/token")
REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "")
SECRET_KEY = os.getenv("SECRET_KEY", "")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "120"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))
GOOGLE_TOKEN_BUFFER_MINUTES = int(os.getenv("GOOGLE_TOKEN_BUFFER_MINUTES", "5"))

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

def create_access_token(data: dict) -> str:
    expire = datetime.datetime.now(
        datetime.UTC) + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({**data, "exp": expire, "scope": "access_token", "type": "access"}, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict) -> str:
    expire = datetime.datetime.now(
        datetime.UTC) + datetime.timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    return jwt.encode({**data, "exp": expire, "scope": "refresh_token", "type": "refresh"}, SECRET_KEY, algorithm=ALGORITHM)


def validate_token_payload(payload: dict) -> bool:
    return all(field in payload for field in {"sub", "exp", "scope", "type"})


def _make_auth_response(user: User) -> JSONResponse:
    """Build the login JSONResponse with user data and auth cookies."""
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    resp = JSONResponse(content={
        "message": "Login successful",
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "profile_picture": user.profile_picture,
        },
    })
    resp.set_cookie("access_token", access_token, httponly=True, secure=True,
                    samesite="none", max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60, path="/")
    resp.set_cookie("refresh_token", refresh_token, httponly=True, secure=True,
                    samesite="none", max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600, path="/")
    return resp


async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)) -> User:
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="No access token provided")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Access token expired")
    except InvalidTokenError as e:
        logger.warning(f"Invalid token attempt: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    if not validate_token_payload(payload):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=ERROR_INVALID_TOKEN_PAYLOAD)
    if payload.get("scope") != "access_token" or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=ERROR_INVALID_TOKEN_SCOPE)

    user_id: str | None = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail=ERROR_INVALID_TOKEN_MISSING_SUBJECT)

    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


# === GOOGLE TOKEN MANAGEMENT ===

async def refresh_google_tokens(user: User, db: AsyncSession) -> bool:
    if user.google_refresh_token is None:
        logger.warning(f"No Google refresh token for user {user.id}")
        return False
    try:
        async with _http_client() as client:
            response = await client.post(TOKEN_URI, data={
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "refresh_token": user.google_refresh_token,
                "grant_type": "refresh_token",
            })
        response.raise_for_status()
        tokens = response.json()
        user.google_access_token = tokens.get("access_token")
        if "expires_in" in tokens:
            user.google_token_expiry = datetime.datetime.now(
                datetime.UTC) + datetime.timedelta(seconds=tokens["expires_in"])
        await db.commit()
        logger.info(f"Google tokens refreshed for user {user.id}")
        return True
    except Exception as e:
        logger.error(f"Failed to refresh Google tokens for user {user.id}: {e}")
        await db.rollback()
        return False


def is_google_token_expired(user: User) -> bool:
    if user.google_token_expiry is None:
        return True
    buffer = datetime.timedelta(minutes=GOOGLE_TOKEN_BUFFER_MINUTES)
    # type: ignore
    return datetime.datetime.now(datetime.UTC) >= (user.google_token_expiry - buffer)


async def ensure_valid_google_tokens(user: User, db: AsyncSession) -> bool:
    if user.google_refresh_token is None:
        return False
    if is_google_token_expired(user):
        return await refresh_google_tokens(user, db)
    return True


# === GOOGLE LOGIN HELPERS ===

async def _exchange_code_for_tokens(code: str, redirect_uri: str) -> GoogleTokenResponse:
    """Exchange the OAuth authorization code for Google tokens."""
    token_data = GoogleTokenRequest(
        code=code,
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        redirect_uri=redirect_uri,
        grant_type="authorization_code",
    )
    async with _http_client() as client:
        response = await client.post(TOKEN_URI, data=token_data.model_dump())

    if response.status_code != 200:
        logger.error(
            f"Google token exchange failed — status={response.status_code} body={response.text} redirect_uri={redirect_uri}")
        response.raise_for_status()

    response_json = response.json()
    if "error" in response_json:
        logger.error(
            f"Google token error: {response_json.get('error_description')}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Authentication failed")

    return GoogleTokenResponse(**response_json)


def _verify_id_token(raw_id_token: str) -> dict:
    """Verify and decode the Google ID token."""
    id_info = id_token.verify_oauth2_token(
        raw_id_token, GoogleRequest(), CLIENT_ID)
    if id_info["iss"] not in ["accounts.google.com", "https://accounts.google.com"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token issuer")
    return id_info


async def _find_or_create_user(db: AsyncSession, id_info: dict) -> User:
    """Return existing user or create a new one from Google ID token claims."""
    email = id_info["email"]
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user:
        return user

    new_user = User(
        name=id_info.get("name", "User"),
        email=email,
        google_id=id_info["sub"],
        auth_provider="google",
        profile_picture=id_info.get("picture", ""),
    )
    db.add(new_user)
    try:
        await db.commit()
        await db.refresh(new_user)
        logger.info(f"New user created: {email}")
        return new_user
    except IntegrityError:
        await db.rollback()
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create user")
        return user


async def _update_google_tokens(user: User, token_response: GoogleTokenResponse, db: AsyncSession) -> None:
    """Persist the latest Google tokens on the user record."""
    user.google_access_token = token_response.access_token
    user.google_refresh_token = token_response.refresh_token
    if token_response.expires_in:
        user.google_token_expiry = datetime.datetime.now(
            datetime.UTC) + datetime.timedelta(seconds=token_response.expires_in)
    await db.commit()


# === GOOGLE LOGIN ===

@router.post("/google", status_code=status.HTTP_200_OK)
async def google_login(
    login_request: GoogleLoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Login or register via Google OAuth (redirect flow)."""
    if not login_request.code or len(login_request.code) < 10:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Invalid authorization code")

    effective_redirect_uri = login_request.redirect_uri or REDIRECT_URI

    try:
        token_response = await _exchange_code_for_tokens(login_request.code, effective_redirect_uri)
        id_info = _verify_id_token(token_response.id_token)
        user = await _find_or_create_user(db, id_info)
        await _update_google_tokens(user, token_response, db)
        return _make_auth_response(user)

    except HTTPException:
        raise
    except httpx.RequestError as e:
        logger.error(f"Google token exchange network error: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Authentication service unavailable")
    except ValueError as e:
        logger.error(f"Google ID token verification failed: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Invalid authentication token")
    except Exception as e:
        logger.error(f"Unexpected error during Google login: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Internal server error during authentication")


# === REFRESH APP TOKEN ===

@router.post("/refresh", status_code=status.HTTP_200_OK)
async def refresh_token(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token provided")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired")
    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

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

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user and user.google_refresh_token:
        background_tasks.add_task(ensure_valid_google_tokens, user, db)

    new_access_token = create_access_token({"sub": user_id})
    resp = JSONResponse(content={"message": "Access token refreshed"})
    resp.set_cookie("access_token", new_access_token, httponly=True, secure=True,
                    samesite="none", max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60, path="/")
    return resp


async def _attempt_token_refresh(refresh_token: str, db: AsyncSession) -> JSONResponse:
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
    except (ExpiredSignatureError, InvalidTokenError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Session expired, please login again")

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

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user:
        await ensure_valid_google_tokens(user, db)

    new_access_token = create_access_token({"sub": user_id})
    resp = JSONResponse(content={"authenticated": True, "refreshed": True})
    resp.set_cookie("access_token", new_access_token, httponly=True, secure=True,
                    samesite="none", max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60, path="/")
    return resp


# === CHECK AUTH ===

@router.get("/check")
async def check_auth(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> JSONResponse:
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="No access token provided")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id:
            result = await db.execute(select(User).where(User.id == int(user_id)))
            user = result.scalar_one_or_none()
            if user:
                await ensure_valid_google_tokens(user, db)
        return JSONResponse({"authenticated": True, "refreshed": False})

    except ExpiredSignatureError:
        refresh_tok = request.cookies.get("refresh_token")
        if not refresh_tok:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="expired")
        return await _attempt_token_refresh(refresh_tok, db)

    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")


# === REFRESH GOOGLE TOKEN ===

@router.post("/google/refresh", status_code=status.HTTP_200_OK)
async def refresh_google_token(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> JSONResponse:
    user = await get_current_user(request, db)
    if not user.google_refresh_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="No Google refresh token available")

    success = await refresh_google_tokens(user, db)
    if not success:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Failed to refresh Google tokens")

    return JSONResponse({
        "message": "Google tokens refreshed successfully",
        "google_access_token": user.google_access_token,
        "expires_at": user.google_token_expiry.isoformat() if user.google_token_expiry else None,
    })


# === GET CURRENT USER ===

@router.get("/user")
def get_user(user: Annotated[User, Depends(get_current_user)]) -> JSONResponse:
    return JSONResponse({
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "profile_picture": user.profile_picture,
        "auth_provider": user.auth_provider,
    })


# === LOGOUT ===

@router.post("/logout", status_code=status.HTTP_200_OK)
def logout():
    resp = JSONResponse(content={"message": "Logged out successfully"})
    resp.delete_cookie("access_token", path="/", secure=True,
                       httponly=True, samesite="none")
    resp.delete_cookie("refresh_token", path="/", secure=True,
                       httponly=True, samesite="none")
    return resp


# === HEALTH CHECK ===

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
        "features": {
            "google_oauth": bool(CLIENT_ID and CLIENT_SECRET),
            "token_refresh": True,
            "auto_refresh": True,
        },
    }
