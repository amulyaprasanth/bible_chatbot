import requests
from langchain_groq import ChatGroq
import os
from langchain.agents import create_agent
from langchain.tools import tool
from langchain_community.tools import WikipediaQueryRun
from langchain_community.utilities import WikipediaAPIWrapper
from langchain_community.tools import DuckDuckGoSearchResults

from dotenv import load_dotenv
load_dotenv()

groq_api_key = os.getenv("GROQ_API_KEY")
os.environ["LANGCHAIN_API_KEY"] = os.getenv("LANGCHAIN_API_KEY")
os.environ["LANGCHAIN_TRACING_V2"] = "true"


@tool
def bible_search(query: str) -> list[dict]:
    """
    Groq-safe Bible search tool.
    
    Performs a semantic search over the Bible or retrieves a specific verse by reference.
    Returns a list of structured verse dictionaries or an error message if something goes wrong.
    
    Args:
        query (str): A fully formed question, topic, or specific verse reference.
    
    Returns:
        list[dict]: A list of verse objects or a single dictionary with an error key.
    """
    # Validate query
    if not isinstance(query, str) or len(query.strip()) == 0:
        return [{"error": "Invalid query provided."}]
    
    try:
        # Call the API or your vector store here
        response = requests.get(
            f"https://bible-search.antioch.tech/api/search?verse_query={query}",
            timeout=10  # timeout to prevent hanging
        )
        response.raise_for_status()
        data = response.json()
        
        # Ensure output is always a list of dictionaries
        if isinstance(data, list):
            return data
        else:
            return [{"error": "Unexpected API response format."}]
    
    except requests.exceptions.RequestException as e:
        return [{"error": f"Request failed: {str(e)}"}]
    except Exception as e:
        return [{"error": f"Unexpected error: {str(e)}"}]



wikipedia_tool = WikipediaQueryRun(
    api_wrapper=WikipediaAPIWrapper(top_k_results=3))
web_search = DuckDuckGoSearchResults()


prompt_template = """
You are a helpful assistant that answers questions about the Bible and related topics.
Always follow Christian teachings and guidelines.
Only provide answers that are consistent with the Bible. Do NOT give non-Biblical advice or personal opinions.
You can also provide factual information from Wikipedia or via a DuckDuckGo search, but always prioritize Biblical truth.

TOOLS:
------
You have access to the following tools:
- wikipedia_tool: Use this tool to get factual information from Wikipedia articles.

- bible_tool: Use this tool to search the Bible semantically for relevant verses, or retrieve a specific verse by reference (e.g., "John 3:16"). 
  It returns results as a list of structured dictionaries with the following keys:
      - Index: Internal verse index
      - book_name: Name of the book
      - book_number: Book number in the Bible
      - chapter_number: Chapter number
      - translation_name: Bible translation
      - verse_number: Verse number
      - verse_text: Text of the verse

  When providing answers to the user, **only include the verse_text and the reference** (book, chapter, and verse number). 
  **Do NOT include the translation name** like "(ENGLISHBBE)" in your response.

- web_search: Use this tool to search the web for general information.

INSTRUCTIONS:
-------------
1. Always prioritize providing answers directly from the Bible when possible.
2. Use bible_tool for verse retrieval or semantic searches on Biblical topics.
3. Use wikipedia_tool or web_search only for factual context that complements Biblical answers.
4. Format your responses clearly and reference verses appropriately when used.
5. When quoting Bible verses, only include the text and reference; do not include translation names.
"""


agent = create_agent(
    model=ChatGroq(model_name="llama-3.1-8b-instant",
                   groq_api_key=groq_api_key),
    tools=[bible_search, wikipedia_tool, web_search],
    system_prompt=prompt_template
)


if __name__ == "__main__":
    response = agent.invoke(
        {"messages": [{"role": "user", "content": "Where was Moses buried?"}]})

    print(response["messages"][-1].content)
