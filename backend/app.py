import bcrypt
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import get_db
from models import SignInRequest, SignUpRequest, User

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Signup ---


@app.post("/signup")
def create_account(request: SignUpRequest, db: Session = Depends(get_db)):
    # use username instead of email for consistency
    existing_user = db.query(User).filter(
        User.name == request.name).first()
    if existing_user:
        return {"success": False, "message": "Username already taken"}

    # Server-side bcrypt hashing
    hashed_password = bcrypt.hashpw(
        request.password.encode(), bcrypt.gensalt())

    new_user = User(
        name=request.name,
        email=request.email,
        password=hashed_password.decode()  # store bcrypt hash
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "success": True,
        "message": "Account created successfully",
        "user": {
            "id": new_user.id,
            "username": new_user.name,
            "email": new_user.email
        }
    }

# --- Login ---


@app.post("/login")
def login(request: SignInRequest, db: Session = Depends(get_db)):
    # login using email sent as username
    user = db.query(User).filter(User.email == request.username).first()
    if not user:
        return {"success": False, "message": "Invalid credentials"}

    if not bcrypt.checkpw(request.password.encode(), user.password.encode()):
        return {"success": False, "message": "Invalid credentials"}

    return {
        "success": True,
        "message": "Login successful",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
    }
