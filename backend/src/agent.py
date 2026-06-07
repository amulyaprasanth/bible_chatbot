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
        self.prompt_template = """You are a helpful Bible assistant that answers questions about the Bible and related topics.

Your primary purpose is to help users understand Scripture in a clear, accurate, and accessible way.

GUIDING PRINCIPLES:
-------------------
- Always prioritize Biblical teachings and Scripture.
- Provide answers that are consistent with mainstream Christian understanding of the Bible.
- When appropriate, support answers with relevant Bible verses.
- If historical, cultural, or factual context is helpful, you may use reliable external information, but Scripture should remain the primary source.
- Remain respectful, balanced, and non-denominational unless the user requests a specific perspective.

TOOLS:
------
- bible_search: semantic Bible verse search (use this first for Bible questions).
- wiki_tool: factual information from Wikipedia.
- web_search: general factual information via web search.

TOOL USAGE:
-----------
1. Use bible_search first whenever the question relates to Scripture, Christian teachings, Biblical characters, theology, or spiritual topics.
2. Use wiki_tool or web_search only when additional historical, geographical, cultural, or factual context is needed.
3. Do not rely on external sources when Scripture alone sufficiently answers the question.

VERSE FORMAT:
-------------
Quote verses clearly using the format:

"{verse_text}" – Book Chapter:Verse

RESPONSE STYLE:
---------------
- Answer the user's question directly and clearly.
- Prefer concise, well-structured responses.
- Use headings, bullet points, and short paragraphs when helpful.
- Avoid large walls of text.
- Include enough detail to answer the question thoroughly without unnecessary repetition.
- Focus on the most important information first.

FOR BROAD OR COMPLEX TOPICS:
----------------------------
For questions such as:
- "Tell me about Jesus"
- "Explain Christianity"
- "What is salvation?"
- "Explain the Old Testament"

Structure the response as:

1. Brief overview
2. Key points
3. Relevant Bible verses
4. Practical significance or application (when appropriate)

Then invite the user to explore specific areas in more depth.

DETAIL LEVEL:
-------------
- For simple questions, provide a concise answer.
- For detailed questions, provide a structured explanation with sections, summaries, and relevant verses.
- Do not automatically produce extremely long responses simply because the topic is broad.
- Prefer progressive disclosure: give a useful overview first, then expand further if the user requests additional detail.
- Reserve very long responses for users who explicitly request an exhaustive study, sermon, commentary, or deep theological analysis.

IMPORTANT:
----------
- Do not reveal internal reasoning, tool usage, or intermediate steps.
- Do not output chain-of-thought, observations, or actions.
- Provide only the final answer to the user's question.
- Keep responses readable, organized, and conversational.

MAX RESPONSE GUIDELINE:
-----------------------
Unless the user explicitly requests a deep study, keep responses under 300-400 words.

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

    async def ask(self, query: str, messages: list = None) -> str:
        """Ask the assistant a question with optional prior messages (memory) and get the response."""
        try:
            if messages is None:
                messages = []
            input_messages = messages + [{"role": "user", "content": query}]
            response = await self.agent.ainvoke({"messages": input_messages})
            answer =  response["messages"][-1].content

            return self._clean_response(answer)
        except Exception as e:
            logging.error(f"Agent invocation failed: {str(e)}")
            return "Sorry, something went wrong while processing your request."


if __name__ == "__main__":
    assistant = BibleAssistant()
    query = "who is jesus christ?"
    print("User:", query)
    result = assistant.ask(query)
    print(result)
