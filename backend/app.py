from contextlib import asynccontextmanager
from datetime import datetime, timezone
from collections import defaultdict
from time import time
import re
import os

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from auth import get_current_user, router
from db import engine, get_db
from models import (
    AgentQueryRequest,
    AgentQueryResponse,
    Base,
    Conversation,
    Message,
    User,
)
from src.agent import BibleAssistant

from langchain_groq import ChatGroq
from dotenv import load_dotenv

load_dotenv()
groq_api_key = os.getenv("GROQ_API_KEY")

# Rate limiting config
RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "20"))
RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", "60"))
rate_limit_store = defaultdict(list)


def check_rate_limit(user_id: str):
    now = time()
    user_requests = rate_limit_store[user_id]
    user_requests[:] = [t for t in user_requests if now - t < RATE_LIMIT_WINDOW]
    if len(user_requests) >= RATE_LIMIT_REQUESTS:
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please wait before trying again.",
        )
    user_requests.append(now)


# ========================
#  TITLE GENERATOR CLASS
# ========================


class ConversationTitleGenerator:
    """
    Generates conversation titles intelligently.
    - Skips simple greetings
    - Waits until meaningful text appears
    """

    def __init__(self):
        self.model = ChatGroq(
            model_name="llama-3.1-8b-instant", groq_api_key=groq_api_key
        )
        self.greeting_pattern = re.compile(
            r"^(hi|hello|hey|good\s*(morning|evening|afternoon|night)|yo|sup|what'?s up|how are you)[,!\.\s]*$",
            re.IGNORECASE,
        )

    def _clean_message(self, message: str) -> str:
        """Remove greetings prefix but keep meaningful text."""
        message = message.strip()
        message = re.sub(
            r"^(hi|hello|hey|good\s*(morning|evening|afternoon|night)|yo|sup|what'?s up|how are you)[,!\.\s]*(.*)$",
            r"\3",
            message,
            flags=re.IGNORECASE,
        ).strip()
        return message

    def should_generate_title(self, messages: list[dict]) -> bool:
        """Check if the conversation has a meaningful user message."""
        if not messages:
            return False

        user_msgs = [m.content for m in messages if m.sender_type == "user"]
        if not user_msgs:
            return False

        last_message = user_msgs[-1].strip()
        cleaned = self._clean_message(last_message)

        if not cleaned or len(cleaned.split()) < 2:
            return False

        return True

    def generate_title(self, message: str) -> str | None:
        """Generate a concise 3–6 word title."""
        cleaned = self._clean_message(message)
        if not cleaned:
            return None

        try:
            prompt = f"Generate a short, 3–6 word title for this conversation topic: '{cleaned}'"
            response = self.model.invoke([{"role": "user", "content": prompt}])
            title = response["messages"][-1].content.strip()
            return title
        except Exception as e:
            print(f"[WARN] Title generation failed: {e}")
            words = cleaned.split()
            return " ".join(words[:5]) + "..." if len(words) > 5 else cleaned


# ========================
#  FASTAPI APP SETUP
# ========================


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine, checkfirst=True)
    yield


agent = BibleAssistant()
title_generator = ConversationTitleGenerator()

app = FastAPI(lifespan=lifespan)
app.include_router(router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://biblechatbot.netlify.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", status_code=200)
def test_health():
    return {"status": "Server is healthy!"}


@app.get("/conversations")
def get_conversations(
    user: User = Depends(get_current_user),
    db=Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    total = db.query(Conversation).filter(Conversation.user_id == user.id).count()
    conversations = (
        db.query(Conversation)
        .filter(Conversation.user_id == user.id)
        .order_by(Conversation.updated_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return {
        "conversations": conversations,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@app.post("/conversations")
async def create_conversation(
    user: User = Depends(get_current_user), db=Depends(get_db)
):
    check_rate_limit(str(user.id))

    new_conv = Conversation(
        user_id=user.id,
        title="New Conversation",
        is_active=True,
        updated_at=datetime.now(timezone.utc),
    )

    db.add(new_conv)
    db.commit()
    db.refresh(new_conv)

    return {"id": new_conv.id, "user_id": new_conv.user_id, "title": new_conv.title}


@app.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: int, user: User = Depends(get_current_user), db=Depends(get_db)
):
    conversation = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.user_id == user.id)
        .first()
    )

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    db.delete(conversation)
    db.commit()
    return {"message": "Conversation deleted"}


@app.get("/messages/{conv_id}")
def get_message(
    conv_id: int,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    conversation = (
        db.query(Conversation)
        .filter(Conversation.id == conv_id, Conversation.user_id == user.id)
        .first()
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    total = db.query(Message).filter(Message.conversation_id == conv_id).count()
    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conv_id)
        .order_by(Message.id.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return {"messages": messages, "total": total, "skip": skip, "limit": limit}


@app.post("/query", response_model=AgentQueryResponse)
async def query_agent(
    request: AgentQueryRequest,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    check_rate_limit(str(user.id))

    conversation = (
        db.query(Conversation)
        .filter(Conversation.id == request.conv_id, Conversation.user_id == user.id)
        .first()
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Save user message
    new_message = Message(
        conversation_id=request.conv_id, sender_type="user", content=request.query
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    # Load prior messages
    prior_messages = (
        db.query(Message)
        .filter(Message.conversation_id == request.conv_id)
        .order_by(Message.id.asc())
        .all()
    )

    formatted_messages = [
        {
            "role": "user" if m.sender_type == "user" else "assistant",
            "content": m.content,
        }
        for m in prior_messages
    ]

    # Ask the Bible assistant
    agent_output = agent.ask(request.query, messages=formatted_messages[:-1])

    # Save assistant response
    agent_response = Message(
        conversation_id=request.conv_id, sender_type="assistant", content=agent_output
    )
    db.add(agent_response)
    db.commit()
    db.refresh(agent_response)

    # =============================
    # Generate conversation title
    # =============================
    if (
        conversation.title == "New Conversation"
        and title_generator.should_generate_title(prior_messages)
    ):
        title = title_generator.generate_title(request.query)
        if title:
            conversation.title = title
            conversation.updated_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(conversation)

    return AgentQueryResponse(
        conv_id=request.conv_id,
        sender_type="assistant",
        content=agent_output,
        title=conversation.title,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="localhost", port=8000)
