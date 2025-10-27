from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from db import engine, get_db
from datetime import datetime, timezone
from models import Base, Conversation, User
from auth import get_current_user, router
from fastapi import HTTPException


# create tables if doesn't exist
@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine, checkfirst=True)
    yield


app = FastAPI(lifespan=lifespan)
app.include_router(router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get('/health', status_code=200)
def test_health():
    return {'status': 'Server is healthy!'}


@app.get("/conversations")
def get_conversations(user: User=Depends(get_current_user), db=Depends(get_db)):
    conversations = db.query(Conversation).filter(
        Conversation.user_id == user.id).all()

    return conversations


@app.post("/conversations")
async def create_conversation(user: User=Depends(get_current_user), db=Depends(get_db)):
    new_conv = Conversation(
        user_id=user.id,
        title="New Conversation",
        is_active=True,
        updated_at=datetime.now(timezone.utc)
    )

    db.add(new_conv)
    db.commit()
    db.refresh(new_conv)

    return {
        "id": new_conv.id,
        "user_id": new_conv.user_id,
        "title": new_conv.title
    }
    
@app.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: int, user: User=Depends(get_current_user), db=Depends(get_db)):
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id, Conversation.user_id == user.id).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    db.delete(conversation)
    db.commit()

    return {"message": "Conversation deleted"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000)
