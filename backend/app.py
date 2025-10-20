from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import get_db
from models import SignInRequest, SignUpRequest, User  # User = SQLAlchemy model

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Signup
@app.post("/signup")
def create_account(request: SignUpRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        return {
            "success": False,
            "message": "Email already registered"
        }
    
    new_user = User(
        name=request.name,
        email=request.email,
        password=request.password  # frontend already hashed
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "success": True,
        "message": "Account created successfully",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email
        }
    }


# Login
@app.post("/login")
def login(request: SignInRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.username).first()
    if not user or user.password != request.password:
        return {
            "success": False,
            "message": "Invalid credentials"
        }
    
    return {
        "success": True,
        "message": "Login successful",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
    }
