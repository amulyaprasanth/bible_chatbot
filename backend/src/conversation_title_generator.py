import re
import os
from typing import Union
from langchain_groq import ChatGroq
from dotenv import load_dotenv

load_dotenv()
groq_api_key = os.getenv("GROQ_API_KEY")


class ConversationTitleGenerator:
    """
    Generates a conversation title intelligently.
    - Ignores simple greetings
    - Handles cases where the user says "Hi, I want to know about..."
    - Waits until a meaningful message arrives
    - Accepts both ORM Message objects and plain dicts
    """

    def __init__(self):
        self.model = ChatGroq(model="llama-3.1-8b-instant",
                              groq_api_key=groq_api_key)
        self.greeting_pattern = re.compile(
            r"^(hi|hello|hey|good\s*(morning|evening|afternoon|night)|yo|sup|what'?s up|how are you)[,!\.\s]*$",
            re.IGNORECASE,
        )

    def _clean_message(self, message: str) -> str:
        """Removes greeting prefix but keeps the meaningful part if present."""
        message = message.strip()
        message = re.sub(
            r"^(hi|hello|hey|good\s*(morning|evening|afternoon|night)|yo|sup|what'?s up|how are you)[,!\.\s]*(.*)$",
            r"\3",
            message,
            flags=re.IGNORECASE,
        ).strip()
        return message

    def _get_field(self, msg: Union[dict, object], field: str) -> str:
        """Safely get a field from either a dict or an ORM object."""
        if isinstance(msg, dict):
            return msg.get(field, "")
        return getattr(msg, field, "")

    def should_generate_title(self, messages: list) -> bool:
        """
        Returns True if the conversation should have a title generated.
        Accepts either ORM Message objects or dicts with sender_type/content.
        """
        if not messages:
            return False

        user_msgs = [
            self._get_field(m, "content")
            for m in messages
            if self._get_field(m, "sender_type") == "user"
        ]
        if not user_msgs:
            return False

        last_message = user_msgs[-1].strip()
        cleaned = self._clean_message(last_message)

        if not cleaned or len(cleaned.split()) < 2:
            return False

        return True

    def generate_title(self, message: str) -> str | None:
        """Generate a short 3–6 word title from the user's meaningful message."""
        cleaned = self._clean_message(message)
        if not cleaned:
            return None

        try:
            prompt = f"Generate a concise 3-6 word title for this conversation topic: '{cleaned}'"
            response = self.model.invoke([{"role": "user", "content": prompt}])
            title = response.content.strip()  # type: ignore
            return title
        except Exception as e:
            print(f"[WARN] Title generation failed: {e}")
            words = cleaned.split()
            return " ".join(words[:5]) + "..." if len(words) > 5 else cleaned
