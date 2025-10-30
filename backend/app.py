from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from auth import get_current_user, router
from db import engine, get_db
from models import AgentQueryRequest, AgentQueryResponse, Base, Conversation, Message, User
from src.agent import BibleAssistant


# create tables if doesn't exist
@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine, checkfirst=True)
    yield


agent = BibleAssistant()
app = FastAPI(lifespan=lifespan)
app.include_router(router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# route for testing server health


@app.get('/health', status_code=200)
def test_health():
    return {'status': 'Server is healthy!'}


# route for getting user conversations


@app.get("/conversations")
def get_conversations(user: User = Depends(get_current_user), db=Depends(get_db)):
    conversations = db.query(Conversation).filter(
        Conversation.user_id == user.id
    ).all()

    return conversations


# end point for new conversation


@app.post("/conversations")
async def create_conversation(user: User = Depends(get_current_user), db=Depends(get_db)):
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


# end point for deleting conversation


@app.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: int, user: User = Depends(get_current_user), db=Depends(get_db)):
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id, Conversation.user_id == user.id
    ).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    db.delete(conversation)
    db.commit()

    return {"message": "Conversation deleted"}


# endpoint for gettting message of a particular conversation
@app.get("/messages/{conv_id}")
def get_message(conv_id: int, user: User = Depends(get_current_user), db=Depends(get_db)):
    # check if conversation belongs to that user
    conversation = db.query(Conversation).filter(
        Conversation.id == conv_id, Conversation.user_id == user.id
    ).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conversation.user_id == user.id:
        messages = db.query(Message).filter(
            Message.conversation_id == conv_id
        ).all()
    return messages


# endpoint for querying llm


@app.post("/query", response_model=AgentQueryResponse)
async def query_agent(request: AgentQueryRequest, user: User = Depends(get_current_user), db=Depends(get_db)):
    # check if conversation belongs to that user
    conversation = db.query(Conversation).filter(
        Conversation.id == request.conv_id, Conversation.user_id == user.id
    ).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if conversation.user_id == user.id:
        # add message to conversation
        new_message = Message(conversation_id=request.conv_id, sender_type="user",
                              content=request.query
                              )
        db.add(new_message)
        db.commit()
        db.refresh(new_message)

        # Load conversation history for memory (excluding this current input)
        prior_messages = db.query(Message).filter(
            Message.conversation_id == request.conv_id
        ).order_by(Message.id.asc()).all()
        formatted_messages = []
        for m in prior_messages:
            if m.sender_type == "user":
                formatted_messages.append(
                    {"role": "user", "content": m.content})
            else:
                formatted_messages.append(
                    {"role": "assistant", "content": m.content})

        # pass memory (not including this latest input)
        agent_output = agent.ask(
            request.query, messages=formatted_messages[:-1])
        # add response to conversation
        agent_response = Message(conversation_id=request.conv_id, sender_type="assistant",
                                 content=agent_output
                                 )
        db.add(agent_response)
        db.commit()
        db.refresh(agent_response)

    return AgentQueryResponse(
        conv_id=request.conv_id,
        sender_type="assistant",
        content=agent_output
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="localhost", port=8000)
