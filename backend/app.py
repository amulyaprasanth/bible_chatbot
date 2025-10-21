from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, Depends, HTTPException, status, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import get_db, engine, Base
from models import ConvIdRequest, Conversation, CreateConversationRequest, Message, SignUpRequest, User
from auth import create_access_token, router as auth_router, get_current_user
import bcrypt

# Import your BibleAssistant
from src.bible_assistant import BibleAssistant

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include auth router
app.include_router(auth_router)


# -----------------------------------------------------
# Health Check Endpoint
# -----------------------------------------------------
@app.get("/health")
def health_check():
    """Health check endpoint for Docker and monitoring"""
    return {"status": "healthy", "service": "bible-chatbot-backend"}


# -----------------------------------------------------
# Initialize Bible Assistants
# -----------------------------------------------------
english_assistant = BibleAssistant(language="english")
telugu_assistant = BibleAssistant(language="telugu")
# Optional: build vector stores on startup
# english_assistant.build_vector_store()
# telugu_assistant.build_vector_store()


# --- Helper functions ---
def get_user_conversations(db: Session, user_id: int):
    return db.query(Conversation).filter(Conversation.user_id == user_id).all()


def fetch_messages(db: Session, conv_id: int):
    return db.query(Message).filter(Message.conversation_id == conv_id).all()


# -----------------------------------------------------
# Signup Endpoint
# -----------------------------------------------------
@app.post("/signup")
def create_account(request: SignUpRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        return {"success": False, "message": "Email already registered"}

    hashed_password = bcrypt.hashpw(
        request.password.encode(), bcrypt.gensalt()
    )

    new_user = User(
        name=request.name,
        email=request.email,
        password_hash=hashed_password.decode()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Generate token immediately
    token = create_access_token(
        data={"sub": new_user.email},
        expires_delta=timedelta(days=7)
    )

    return {
        "success": True,
        "message": "Account created successfully",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email
        },
        "access_token": token,
        "token_type": "bearer"
    }


# -----------------------------------------------------
# Protected routes
# -----------------------------------------------------
@app.get("/users/me")
async def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user


@app.post("/conversations")
async def create_conversation(
    request: CreateConversationRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_conv = Conversation(
        user_id=user.id,
        title="New Conversation",  # can update later using LLM
        language=request.language.lower(),
        is_active=True,
        updated_at=datetime.now(timezone.utc)
    )

    db.add(new_conv)
    db.commit()
    db.refresh(new_conv)

    return {
        "id": new_conv.id,
        "user_id": new_conv.user_id,
        "title": new_conv.title,
        "language": new_conv.language,
        "is_active": new_conv.is_active,
        "updated_at": new_conv.updated_at
    }


@app.get("/conversations")
async def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conversations = get_user_conversations(db, current_user.id)
    return conversations


@app.get("/get_messages")
async def get_messages(
    conv_id: int = Query(..., description="Conversation ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    messages = fetch_messages(db, conv_id)
    return messages


@app.put("/conversations/{conv_id}/title")
async def update_conversation_title(
    conv_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update conversation title based on conversation content"""
    # Get the conversation
    conversation = db.query(Conversation).filter(
        Conversation.id == conv_id,
        Conversation.user_id == current_user.id
    ).first()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    # Get conversation messages
    messages = fetch_messages(db, conv_id)

    # Generate title based on language
    if conversation.language.lower() == "english":
        assistant = english_assistant
    elif conversation.language.lower() == "telugu":
        assistant = telugu_assistant
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid language"
        )

    # Generate new title
    new_title = assistant.generate_conversation_title(messages)

    # Update the conversation title
    conversation.title = new_title
    conversation.updated_at = datetime.now(timezone.utc)
    db.commit()

    return {
        "id": conversation.id,
        "title": conversation.title,
        "updated_at": conversation.updated_at
    }


@app.delete("/conversations/{conv_id}")
async def delete_conversation(
    conv_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a conversation and all its messages"""
    # Get the conversation
    conversation = db.query(Conversation).filter(
        Conversation.id == conv_id,
        Conversation.user_id == current_user.id
    ).first()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    # Delete the conversation (messages will be deleted due to cascade)
    db.delete(conversation)
    db.commit()

    return {"message": "Conversation deleted successfully"}


# -----------------------------------------------------
# RAG Query Route (Protected)
# -----------------------------------------------------
@app.post("/query")
async def query_bible(
    question: str = Body(..., embed=True),
    language: str = Body("english", embed=True),
    conv_id: int = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if language.lower() == "english":
        assistant = english_assistant
    elif language.lower() == "telugu":
        assistant = telugu_assistant
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Language must be 'english' or 'telugu'"
        )

    try:
        # Save user message to database
        user_message = Message(
            conversation_id=conv_id,
            sender_type="USER",
            content=question,
            sent_at=datetime.now(timezone.utc)
        )
        db.add(user_message)
        db.commit()

        # Fetch conversation history for this conversation
        conversation_messages = db.query(Message).filter(
            Message.conversation_id == conv_id,
            Message.id < user_message.id  # Exclude the message we just added
        ).order_by(Message.sent_at).all()

        # Get AI response with conversation history
        answer = assistant.query_with_history(
            question,
            conversation_messages,
            session_id=str(conv_id)
        )

        # Save AI response to database
        ai_message = Message(
            conversation_id=conv_id,
            sender_type="BOT",
            content=answer,
            sent_at=datetime.now(timezone.utc)
        )
        db.add(ai_message)
        db.commit()

        # Generate title after first message exchange (when we have 2 messages: user + bot)
        all_messages = fetch_messages(db, conv_id)
        if len(all_messages) == 2:  # First user message + first bot response
            try:
                new_title = assistant.generate_conversation_title(all_messages)
                # Update conversation title
                conversation = db.query(Conversation).filter(
                    Conversation.id == conv_id).first()
                if conversation:
                    conversation.title = new_title
                    conversation.updated_at = datetime.now(timezone.utc)
                    db.commit()
            except Exception as e:
                # Don't fail the query if title generation fails
                print(f"Failed to generate title: {str(e)}")

        return {"answer": answer}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch answer: {str(e)}"
        )
