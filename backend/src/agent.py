import logging
import os

import requests
from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.tools import tool
from langchain_community.tools import DuckDuckGoSearchResults, WikipediaQueryRun
from langchain_community.utilities import WikipediaAPIWrapper
from langchain_groq import ChatGroq

load_dotenv()


@tool(
    "bible_search",
    description="Performs vector similarity search on bible vector store and returns the results",
)
def bible_search(query: str) -> list[dict]:
    """Perform a semantic Bible search or fetch a verse by reference."""
    if not isinstance(query, str) or not query.strip():
        return [{"error": "Invalid query provided."}]

    try:
        response = requests.get(
            f"https://bible-search.antioch.tech/api/search?verse_query={query}",
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()

        if isinstance(data, list):
            return data
        else:
            return [{"error": "Unexpected API response format."}]
    except requests.exceptions.RequestException as e:
        return [{"error": f"Request failed: {str(e)}"}]
    except Exception as e:
        return [{"error": f"Unexpected error: {str(e)}"}]


class BibleAssistant:
    """An intelligent assistant for answering Bible-related and factual questions."""

    def __init__(self):
        self.groq_api_key = os.getenv("GROQ_API_KEY")

        # Define system prompt
        self.prompt_template = """
        You are a helpful Bible assistant that answers questions about the Bible and related topics.
        Always follow Christian teachings and guidelines.
        Only provide answers that are consistent with the Bible. Do NOT give non-Biblical advice or personal opinions.
        You can also provide factual information from Wikipedia or via web search, but always prioritize Biblical truth.
        
        TOOLS:
        ------
        - bible_search: semantic Bible verse search (use this first for Bible questions).
        - wiki_tool: factual information from Wikipedia.
        - web_search: general factual information via web search.
        
        INSTRUCTIONS:
        -------------
        1. Always prioritize Bible-based answers using bible_search.
        2. Use wiki_tool or web_search only for factual context not in the Bible.
        3. Quote verses clearly as: "{verse_text}" – {book} {chapter}:{verse}
        
        ANSWER LENGTH:
        ---------------
        - If the user asks for a brief, short, or concise answer (e.g., "briefly", "in short", "quickly"), give a concise response.
        - If the user asks for an elaborate, detailed, or in-depth answer (e.g., "elaborate", "explain in detail", "tell me more", "comprehensively"), provide a thorough, detailed response with multiple verses and explanations.
        - If no preference is stated, provide a balanced response that is neither too short nor overly long.
        
        Do NOT include any intermediate steps, thoughts, actions, or observations in your response.
        ONLY return the Final Answer - nothing else.
        
        IMPORTANT: Your response should ONLY contain the Final Answer. Do NOT include:
        - "Question:", "Thought:", "Action:", "Action Input:", "Observation:", etc.
        - Any reasoning steps or intermediate steps
        - Only provide a helpful, clear answer to the user's question.
        """

        # Initialize model
        self.model = ChatGroq(model="llama-3.1-8b-instant", api_key=self.groq_api_key)

        # initliaze tools
        api_wrapper = WikipediaAPIWrapper(top_k_results=3, doc_content_chars_max=500)  # type:ignore
        wiki_tool = WikipediaQueryRun(api_wrapper=api_wrapper)

        web_search = DuckDuckGoSearchResults()

        # Register tools
        wiki_tool.name = "wiki_tool"
        web_search.name = "web_search"
        self.tools = [bible_search, wiki_tool, web_search]

        # Create agent
        self.agent = create_agent(
            model=self.model,
            tools=self.tools,
            system_prompt=self.prompt_template,
        )

    def _clean_response(self, answer: str) -> str:
        """Clean the response to remove any intermediate steps or observations."""
        # Remove any lines starting with Question:, Thought:, Action:, Action Input:, Observation:
        lines = answer.split("\n")
        cleaned_lines = []

        for line in lines:
            stripped = line.strip()
            # Skip any line that looks like an intermediate step
            if any(
                stripped.startswith(prefix)
                for prefix in [
                    "Question:",
                    "Thought:",
                    "Action:",
                    "Action Input:",
                    "Observation:",
                    "I need to",
                    "Let me",
                    "I should",
                    "I will use",
                    "I can use",
                    "Using",
                    "First,",
                    "Then,",
                ]
            ):
                continue
            cleaned_lines.append(line)

        cleaned = "\n".join(cleaned_lines).strip()

        # If we still have Final Answer pattern, extract just that
        if "Final Answer:" in cleaned:
            parts = cleaned.split("Final Answer:", 1)
            cleaned = parts[1].strip()

        return cleaned

    def ask(self, query: str, messages: list = None) -> str:
        """Ask the assistant a question with optional prior messages (memory) and get the response."""
        try:
            if messages is None:
                messages = []
            input_messages = messages + [{"role": "user", "content": query}]
            response = self.agent.invoke({"messages": input_messages})
            answer = response["messages"][-1].content

            return self._clean_response(answer)
        except Exception as e:
            logging.error(f"Agent invocation failed: {str(e)}")
            return "Sorry, something went wrong while processing your request."


if __name__ == "__main__":
    assistant = BibleAssistant()
    query = "who is jesus christ?"
    print("User:", query)
    print("Assistant:", assistant.ask(query))
