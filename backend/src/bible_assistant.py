import hashlib
import os
import sys
import time
import re
from typing import List
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFDirectoryLoader
from langchain_huggingface import HuggingFaceEmbeddings
from astrapy.info import VectorServiceOptions
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_astradb import AstraDBVectorStore
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains.retrieval import create_retrieval_chain
from langchain.chains.history_aware_retriever import create_history_aware_retriever
from langchain_groq import ChatGroq
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.messages import HumanMessage, AIMessage
from src import logger

# Load environment
load_dotenv()
os.environ["GROQ_API_KEY"] = os.getenv("GROQ_API_KEY", "")
os.environ["LANGCHAIN_API_KEY"] = os.getenv("LANGCHAIN_API_KEY", "")
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_PROJECT"] = os.getenv("LANGCHAIN_PROJECT", "")

ASTRA_DB_ENDPOINT = os.getenv("ASTRADB_ENDPOINT")
ASTRA_DB_TOKEN = os.getenv("ASTRADB_APPLICATION_TOKEN")

if not ASTRA_DB_ENDPOINT or not ASTRA_DB_TOKEN:
    logger.critical(
        "AstraDB credentials missing. Please check .env configuration.")
    sys.exit(1)


class BibleAssistant:
    SUPPORTED_LANGUAGES = {"telugu", "english"}
    DEFAULT_CONVERSATION_TITLE = "New Conversation"

    def __init__(self, language: str):
        self.language = language.strip().lower()
        if self.language not in self.SUPPORTED_LANGUAGES:
            raise ValueError(
                f"Language must be one of {self.SUPPORTED_LANGUAGES}")

        logger.info(
            f"BibleAssistant initialized for {self.language.capitalize()} Bible.")

        self._store = {}  # in-memory chat history
        self.vector_store = None
        self.retrieval_chain = self._setup_chain()

    @staticmethod
    def generate_doc_id(doc: Document) -> str:
        return hashlib.sha256(doc.page_content.encode("utf-8")).hexdigest()

    def _get_data_path(self) -> str:
        data_dir = f"../data/{self.language.capitalize()}"
        if not os.path.exists(data_dir):
            raise FileNotFoundError(f"Data directory not found: {data_dir}")
        return data_dir

    def _load_and_split_documents(self) -> List[Document]:
        loader = PyPDFDirectoryLoader(self._get_data_path())
        docs = loader.load()

        # Configure RecursiveCharacterTextSplitter for verse-level splitting
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            is_separator_regex=False,
            separators=[
                "\n\n",  # Paragraph breaks
                "\n",    # Line breaks (verse boundaries)
                ". ",    # Sentence breaks
                " ",     # Word breaks
                ""       # Character breaks (fallback)
            ]
        )

        return text_splitter.split_documents(docs)

    def build_vector_store(self):
        try:
            start = time.time()
            chunks = self._load_and_split_documents()

            if self.language == "english":
                hf_vectorize_options = VectorServiceOptions(
                    provider="huggingface",
                    model_name="sentence-transformers/all-MiniLM-L6-v2",
                    authentication={"providerKey": "bible_embeddings"},
                )
                self.vector_store = AstraDBVectorStore(
                    collection_name="english_bible",
                    api_endpoint=ASTRA_DB_ENDPOINT,
                    token=ASTRA_DB_TOKEN,
                    collection_vector_service_options=hf_vectorize_options,
                )
            else:
                embedding_model = HuggingFaceEmbeddings(
                    model_name="l3cube-pune/telugu-sentence-bert-nli")
                self.vector_store = AstraDBVectorStore(
                    collection_name="telugu_bible",
                    api_endpoint=ASTRA_DB_ENDPOINT,
                    token=ASTRA_DB_TOKEN,
                    embedding=embedding_model,
                )

            ids = [self.generate_doc_id(doc) for doc in chunks]
            self.vector_store.add_documents(chunks, ids=ids)
            logger.info(
                f"✅ Uploaded {len(chunks)} verse-level chunks in {time.time() - start:.2f}s")
        except Exception as e:
            logger.exception(f"❌ Failed to build vector store: {str(e)}")
            sys.exit(1)

    def _setup_chain(self):
        # Initialize vector store
        if self.language == "english":
            hf_vectorize_options = VectorServiceOptions(
                provider="huggingface",
                model_name="sentence-transformers/all-MiniLM-L6-v2",
                authentication={"providerKey": "bible_embeddings"},
            )
            vector_store = AstraDBVectorStore(
                collection_name="english_bible",
                api_endpoint=ASTRA_DB_ENDPOINT,
                token=ASTRA_DB_TOKEN,
                collection_vector_service_options=hf_vectorize_options,
            )
        else:
            embedding_model = HuggingFaceEmbeddings(
                model_name="l3cube-pune/telugu-sentence-bert-nli")
            vector_store = AstraDBVectorStore(
                collection_name="telugu_bible",
                api_endpoint=ASTRA_DB_ENDPOINT,
                token=ASTRA_DB_TOKEN,
                embedding=embedding_model,
            )

        self.vector_store = vector_store

        # Prompts
        system_text = (
            "You are a helpful assistant that answers only in "
            f"{'Telugu' if self.language == 'telugu' else 'English'}.\n"
            "Use the provided Bible context to answer the user's question.\n"
            "Do not make up or hallucinate any information.\n\nContext:\n{context}"
        )

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_text),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
        ])

        contextualize_system_prompt = (
            "Given the following conversation and a follow-up question, "
            "rephrase the follow-up question to be a standalone question.\n\n"
            "Chat History:\n{chat_history}\nFollow Up Input: {input}\nStandalone Question:"
        )
        contextualize_prompt = ChatPromptTemplate.from_template(
            contextualize_system_prompt)

        llm = ChatGroq(model_name="llama-3.3-70b-versatile")
        docs_chain = create_stuff_documents_chain(llm, prompt)
        retriever = create_history_aware_retriever(
            llm, vector_store.as_retriever(), contextualize_prompt
        )
        chain = create_retrieval_chain(retriever, docs_chain)

        return RunnableWithMessageHistory(
            chain,
            self._get_session_history,
            input_messages_key="input",
            history_messages_key="chat_history",
            output_messages_key="answer",
        )

    # -----------------------------------------------------
    # Memory management
    # -----------------------------------------------------
    def _get_session_history(self, session_id: str):
        if session_id not in self._store:
            self._store[session_id] = ChatMessageHistory()
        return self._store[session_id]

    def query(self, query: str, session_id: str = "default") -> str:
        response = self.retrieval_chain.invoke(
            {"input": query},
            config={"configurable": {"session_id": session_id}},
        )
        return response.get("answer", "No answer found.")

    def query_with_history(self, query: str, conversation_messages: List, session_id: str = "default") -> str:
        """
        Query with conversation history from database.
        conversation_messages: List of Message objects from database
        """
        # Get or create session history
        session_history = self._get_session_history(session_id)

        # Clear existing history and populate with database messages
        session_history.clear()

        # Convert database messages to LangChain message format
        for msg in conversation_messages:
            if msg.sender_type == "USER":
                session_history.add_message(HumanMessage(content=msg.content))
            elif msg.sender_type == "BOT":
                session_history.add_message(AIMessage(content=msg.content))

        # Query with the populated history
        response = self.retrieval_chain.invoke(
            {"input": query},
            config={"configurable": {"session_id": session_id}},
        )
        return response.get("answer", "No answer found.")

    def generate_conversation_title(self, conversation_messages: List) -> str:
        """
        Generate a title for the conversation based on the first few messages.
        """
        if not conversation_messages:
            return self.DEFAULT_CONVERSATION_TITLE

        # Get the first few messages to understand the conversation topic
        # First 3 messages should be enough
        first_messages = conversation_messages[:3]

        # Create a summary of the conversation for title generation
        conversation_summary = ""
        for msg in first_messages:
            if msg.sender_type == "USER":
                conversation_summary += f"User: {msg.content}\n"
            elif msg.sender_type == "BOT":
                conversation_summary += f"Assistant: {msg.content}\n"

        # Create a prompt for title generation
        title_prompt = f"""
Based on the following conversation, generate a concise, descriptive title (maximum 50 characters) that captures the main topic or question being discussed.

Conversation:
{conversation_summary}

Generate a title that:
1. Is concise and descriptive
2. Captures the main topic or question
3. Is appropriate for a conversation list
4. Maximum 50 characters

Title:"""

        try:
            # Use the same LLM but with a simple prompt for title generation
            llm = ChatGroq(model_name="llama-3.3-70b-versatile")
            response = llm.invoke(title_prompt)
            title = response.content.strip()

            # Clean up the title - remove quotes if present and limit length
            title = title.replace('"', '').replace("'", '').strip()
            if len(title) > 50:
                title = title[:47] + "..."

            return title if title else self.DEFAULT_CONVERSATION_TITLE
        except Exception as e:
            logger.error(f"Failed to generate conversation title: {str(e)}")
            return self.DEFAULT_CONVERSATION_TITLE


if __name__ == "__main__":
    try:
        # English Bible
        logger.info("Building vector store for English Bible...")
        english_assistant = BibleAssistant(language="english")
        english_assistant.build_vector_store()
        logger.info("✅ English Bible vector store uploaded successfully.\n")

        # Telugu Bible
        logger.info("Building vector store for Telugu Bible...")
        telugu_assistant = BibleAssistant(language="telugu")
        telugu_assistant.build_vector_store()
        logger.info("✅ Telugu Bible vector store uploaded successfully.\n")

        logger.info("🎉 All Bibles uploaded to vector store successfully!")
    except Exception as e:
        logger.exception(f"❌ Failed to upload Bible documents: {str(e)}")
        sys.exit(1)
