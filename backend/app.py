from contextlib import asynccontextmanager
from datetime import datetime, timezone
from time import time
import os
from typing import Annotated

import redis.asyncio as aioredis
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse

from auth import get_current_user, router
from db import engine, get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from models import (
    AgentQueryRequest,
    AgentQueryResponse,
    Base,
    Conversation,
    Message,
    User,
)
from src.agent import BibleAssistant
from src.conversation_title_generator import ConversationTitleGenerator
from dotenv import load_dotenv

load_dotenv()
os.environ["GROQ_API_KEY"] = os.getenv("GROQ_API_KEY", "")

# Rate limiting config
RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "20"))
RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", "60"))  # seconds

ERROR_CONVERSATION_NOT_FOUND = "Conversation not found"

# Redis client (initialised in lifespan)
redis_client: aioredis.Redis | None = None


async def check_rate_limit(user_id: str):
    """
    Sliding-window rate limiter backed by Redis sorted sets.
    Key: rate_limit:<user_id>
    Members: request timestamps (float), scored by the same timestamp.
    Expired entries are pruned on every call; the key TTL is reset to the window size.
    Falls back silently if Redis is unavailable.
    """
    if redis_client is None:
        return  # Redis not available — fail open

    key = f"rate_limit:{user_id}"
    now = time()
    window_start = now - RATE_LIMIT_WINDOW

    try:
        pipe = redis_client.pipeline()
        # Remove timestamps outside the current window
        pipe.zremrangebyscore(key, "-inf", window_start)
        # Count remaining requests in the window
        pipe.zcard(key)
        # Add current request timestamp
        pipe.zadd(key, {str(now): now})
        # Reset TTL so the key expires after the window
        pipe.expire(key, RATE_LIMIT_WINDOW)
        results = await pipe.execute()

        request_count = results[1]  # zcard result (before adding current)
        if request_count >= RATE_LIMIT_REQUESTS:
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please wait before trying again.",
            )
    except HTTPException:
        raise
    except Exception:
        # Redis error — fail open rather than blocking all users
        pass


# ========================
#  FASTAPI APP SETUP
# ========================


@asynccontextmanager
async def lifespan(app: FastAPI):
    global redis_client
    redis_url = os.getenv("REDIS_URI", "")
    if redis_url:
        try:
            redis_client = aioredis.from_url(
                redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=5,
            )
            await redis_client.ping() # type: ignore
        except Exception as e:
            print(f"[WARN] Redis unavailable, rate limiting disabled: {e}")
            redis_client = None

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield

    if redis_client:
        await redis_client.aclose()


agent = BibleAssistant()
title_generator = ConversationTitleGenerator()

app = FastAPI(lifespan=lifespan)
app.include_router(router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173",
                   "https://versechatapp.netlify.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", status_code=200)
def test_health():
    return {"status": "Server is healthy!"}

@app.get("/redis-test")
async def redis_test():
    if redis_client is None:
        return {"status": "redis not connected"}

    try:
        await redis_client.set("test_key", "hello", ex=30)
        value = await redis_client.get("test_key")

        return {
            "status": "redis working",
            "value": value,
        }

    except Exception as e:
        return {
            "status": "redis error",
            "error": str(e),
        }


@app.get("/conversations")
async def get_conversations(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
):
    result = await db.execute(
        select(func.count())
        .select_from(Conversation)
        .where(Conversation.user_id == user.id)
    )
    total = result.scalar()

    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == user.id)
        .order_by(Conversation.updated_at.desc())
        .offset(skip)
        .limit(limit)
    )
    conversations = result.scalars().all()
    return {
        "conversations": conversations,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@app.post("/conversations", responses={
    429: {"description": "Too many requests. Please wait before trying again."}
})
async def create_conversation(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> JSONResponse:
    await check_rate_limit(str(user.id))

    new_conv = Conversation(
        user_id=user.id,
        title="New Conversation",
        is_active=True,
        updated_at=datetime.now(timezone.utc),
    )
    db.add(new_conv)
    await db.commit()
    await db.refresh(new_conv)

    return JSONResponse({"id": new_conv.id, "user_id": new_conv.user_id, "title": new_conv.title})


@app.delete("/conversations/{conversation_id}",
            responses={404: {"description": ERROR_CONVERSATION_NOT_FOUND}})
async def delete_conversation(
    conversation_id: int,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    conversation = (
        await db.execute(
            select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == user.id,
            )
        )
    ).scalar_one_or_none()

    if not conversation:
        raise HTTPException(
            status_code=404, detail=ERROR_CONVERSATION_NOT_FOUND)

    await db.delete(conversation)
    await db.commit()
    return {"message": "Conversation deleted"}


@app.get("/messages/{conv_id}")
async def get_message(
    conv_id: int,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
):
    conversation = (
        await db.execute(
            select(Conversation).where(
                Conversation.id == conv_id,
                Conversation.user_id == user.id,
            )
        )
    ).scalar_one_or_none()

    if not conversation:
        raise HTTPException(
            status_code=404, detail=ERROR_CONVERSATION_NOT_FOUND)

    total_result = await db.execute(
        select(func.count())
        .select_from(Message)
        .where(Message.conversation_id == conv_id)
    )
    total = total_result.scalar()

    messages_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conv_id)
        .order_by(Message.id.asc())
        .offset(skip)
        .limit(limit)
    )
    messages = messages_result.scalars().all()
    return {"messages": messages, "total": total, "skip": skip, "limit": limit}


@app.post("/query", response_model=AgentQueryResponse,
          responses={
              429: {"description": "Too many requests. Please wait before trying again."},
              404: {"description": ERROR_CONVERSATION_NOT_FOUND},
          })
async def query_agent(
    request: AgentQueryRequest,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await check_rate_limit(str(user.id))

    conversation = (
        await db.execute(
            select(Conversation).where(
                Conversation.id == request.conv_id,
                Conversation.user_id == user.id,
            )
        )
    ).scalar_one_or_none()

    if not conversation:
        raise HTTPException(
            status_code=404, detail=ERROR_CONVERSATION_NOT_FOUND)

    # Save user message
    new_message = Message(
        conversation_id=request.conv_id, sender_type="user", content=request.query
    )
    db.add(new_message)
    await db.commit()
    await db.refresh(new_message)

    # Load prior messages
    prior_messages = (
        await db.execute(
            select(Message)
            .where(Message.conversation_id == request.conv_id)
            .order_by(Message.id.asc())
        )
    ).scalars().all()

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
    await db.commit()
    await db.refresh(agent_response)

    # Generate conversation title if still default
    if (
        conversation.title == "New Conversation"
        and title_generator.should_generate_title(prior_messages)
    ):
        title = title_generator.generate_title(request.query)
        if title:
            conversation.title = title
            conversation.updated_at = datetime.now(timezone.utc)
            await db.commit()
            await db.refresh(conversation)

    return AgentQueryResponse(
        conv_id=request.conv_id,
        sender_type="assistant",
        content=agent_output,
        title=conversation.title,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="localhost", port=8000)
