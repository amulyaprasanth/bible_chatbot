# Bible Chatbot

[![Python](https://img.shields.io/badge/Python-3.12+-blue.svg)](https://www.python.org/) [![Streamlit](https://img.shields.io/badge/Streamlit-App-green.svg)](https://biblechatbot-2zdhecs8pnxdyj3ufmgjqx) [![License](https://img.shields.io/badge/License-MIT-lightgrey.svg)](LICENSE)

A multilingual Bible assistant powered by **RAG** (Retrieval-Augmented Generation), supporting **English** and **Telugu** Bible texts. Uses **vector embeddings**, **LangChain**, and **Groq Llama 3.3 70B model** to provide intelligent responses via a **Streamlit web interface**.

---

## Features

* 🌍 **Multilingual**: English and Telugu Bible texts
* 🔍 **Semantic Search**: Vector-based retrieval
* 📚 **RAG Implementation**: Context-aware answers with chat history
* ☁️ **Cloud Vector Storage**: AstraDB for embeddings
* 🎨 **Web Interface**: Real-time streaming responses
* 🤖 **AI-Powered**: Groq Llama 3.3 70B for interpretation
* 💬 **Session Management**: Persistent chat history per user

---

## Quick Start

### 1. Install

```bash
git clone <repository-url>
cd bible_chatbot
pip install poetry
poetry install
poetry shell
```

or using pip:

```bash
python -m venv venv
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows
pip install -r requirements.txt
```

### 2. Configure

Create `.env` in project root:

```env
ASTRADB_ENDPOINT=https://your-database-id-region.astra.datastax.com
ASTRADB_APPLICATION_TOKEN=your-astra-token
GROQ_API_KEY=your-groq-api-key
LANGCHAIN_API_KEY=your-langchain-api-key
LANGCHAIN_PROJECT=your-project-name
```

### 3. Build Vector Store

```python
from src.bible_assistant import BibleAssistant

assistant_en = BibleAssistant(language="english")
assistant_en.build_vector_store()

assistant_te = BibleAssistant(language="telugu")
assistant_te.build_vector_store()
```

### 4. Run Chatbot

```bash
streamlit run main.py
```

Open your browser at `http://localhost:8501` and select your preferred Bible language.

---

## Usage

* Ask questions like:

  * "What does John 3:16 say?"
  * "Explain the story of David and Goliath"
  * "What are the Ten Commandments?"

* Each session maintains chat history for contextual responses.

---

## Deployment

* Can be deployed **locally** or on cloud platforms supporting Python and Streamlit (e.g., Heroku, AWS, Azure)
* Ensure `.env` variables are set for production
* Use **persistent session IDs** to maintain chat history across user sessions

**Example: Deploy on Streamlit Cloud**

```bash
git push origin main
```

Connect your repo to [Streamlit Cloud](https://share.streamlit.io/) and it will automatically deploy your app.

---

## Technical Overview

* **English Embeddings**: AstraDB Vector Service + `sentence-transformers/all-MiniLM-L6-v2`
* **Telugu Embeddings**: HuggingFace `l3cube-pune/telugu-sentence-bert-nli`
* **PDF Processing**: Chunks of 2000 characters with 200 overlap, hash-based IDs for retrieval
* **Vector Collections**: `english_bible`, `telugu_bible`

---

## License

MIT License – see [LICENSE](LICENSE)

---

## Acknowledgments

* [LangChain](https://github.com/langchain-ai/langchain) – RAG framework
* [AstraDB](https://www.datastax.com/products/datastax-astra) – Vector database
* [HuggingFace](https://huggingface.co/) – Embedding models
* [Streamlit](https://streamlit.io/) – Web interface

---
