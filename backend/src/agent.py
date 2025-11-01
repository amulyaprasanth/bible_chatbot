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


@tool("bible_search", description="Performs vector similarity search on bible vector store and returns the results")
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
        os.environ["LANGCHAIN_API_KEY"] = os.getenv("LANGCHAIN_API_KEY")
        os.environ["LANGCHAIN_TRACING_V2"] = "true"

        # Define system prompt
        self.prompt_template = """
        You are a helpful assistant that answers questions about the Bible and related topics.
        Always follow Christian teachings and guidelines.
        Only provide answers that are consistent with the Bible. Do NOT give non-Biblical advice or personal opinions.
        You can also provide factual information from Wikipedia or via a DuckDuckGo search, but always prioritize Biblical truth.
        
        TOOLS:
        ------
        - wiki_tool: factual information from Wikipedia.
        - bible_search: semantic Bible verse search.
        - web_search: general factual information via DuckDuckGo.
        
        INSTRUCTIONS:
        -------------
        1. Always prioritize Bible-based answers.
        2. Use bible_search for verses or topics.
        3. Use wiki_tool or web_search only for factual context.
        4. Quote verses as: “{verse_text} – {book} {chapter}:{verse}”.
        
        Use the following format:
        Question: the input question you must answer
        Thought: you should always think about what to do
        Action: the action to take, should be one of [{tool_names}]
        Action Input: the input to the action
        Observation: the result of the action
        ... (this Thought/Action/Action Input/Observation can repeat N times)
        Thought: I now know the final answer
        Final Answer: the final answer to the original input question
        """

        # Initialize model
        self.model = ChatGroq(
            model="llama-3.1-8b-instant", api_key=self.groq_api_key
        )

        # initliaze tools
        api_wrapper = WikipediaAPIWrapper(
            top_k_results=3, doc_content_chars_max=500)  # type:ignore
        wiki_tool = WikipediaQueryRun(api_wrapper=api_wrapper)

        web_search = DuckDuckGoSearchResults()

        # Register tools
        # Ensure tool names match those referenced in the prompt template
        wiki_tool.name = "wiki_tool"
        web_search.name = "web_search"
        self.tools = [
            bible_search,
            wiki_tool,
            web_search
        ]

        # Create agent using create_agent (was previously malformed)
        self.agent = create_agent(
            model=self.model,
            tools=self.tools,
            system_prompt=self.prompt_template,
        )

    def ask(self, query: str, messages: list = None) -> str:
        """Ask the assistant a question with optional prior messages (memory) and get the response."""
        try:
            if messages is None:
                messages = []
            # Add the user's new query as the last message
            input_messages = messages + [{"role": "user", "content": query}]
            response = self.agent.invoke({"messages": input_messages})
            answer = response["messages"][-1].content

            # Extract only "Final Answer" section if present
            if "Final Answer:" in answer:
                # Optionally, strip other thoughts
                parts = answer.split("Final Answer:", 1)
                cleaned = parts[1].strip()
                return cleaned
            return answer
        except Exception as e:
            logging.error(f"Agent invocation failed: {str(e)}")
            return "Sorry, something went wrong while processing your request."
        
    


if __name__ == "__main__":
    assistant = BibleAssistant()
    query = "who is jesus christ?"
    print("User:", query)
    print("Assistant:", assistant.ask(query))
