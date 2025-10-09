# Bible Chatbot

A multilingual Bible assistant powered by RAG (Retrieval-Augmented Generation) that supports both English and Telugu Bible texts. The application uses vector embeddings, LangChain, and Groq's Llama 3.3 70B model to provide intelligent responses about Bible content through an intuitive Streamlit web interface.

## Features

- 🌍 **Multilingual Support**: English and Telugu Bible texts with language-specific embeddings
- 🔍 **Smart Search**: Vector-based semantic search using HuggingFace embeddings (sentence-transformers for English, Telugu-SBERT for Telugu)
- 📚 **RAG Implementation**: Retrieval-Augmented Generation with conversation history for accurate Bible references
- ☁️ **Cloud Vector Store**: Uses AstraDB for scalable vector storage and retrieval
- 🎨 **Web Interface**: Interactive Streamlit-based chat interface with real-time streaming responses
- 🤖 **Advanced AI**: Powered by Groq's Llama 3.3 70B model for intelligent Bible interpretation
- 📖 **PDF Processing**: Automatic extraction and intelligent chunking of Bible PDFs
- 💬 **Session Management**: Persistent chat history and context-aware conversations

## Project Structure

```
bible_chatbot/
├── data/
│   ├── English/
│   │   └── whole_bible_niv1984.pdf
│   └── Telugu/
│       ├── 1.pdf, 2.pdf, ..., 66.pdf
├── src/
│   └── bible_assistant.py
├── research/
│   ├── trails-english.ipynb
│   └── trails-telugu.ipynb
├── logs/
├── main.py
├── pyproject.toml
└── requirements.txt
```

## Prerequisites

- Python 3.12+
- [AstraDB](https://astra.datastax.com/) account and database
- [Groq](https://console.groq.com/) API key (for LLM inference)
- [LangChain](https://www.langchain.com/) account (for tracing)

## Installation

### Using Poetry (Recommended)

1. Clone the repository:

```bash
git clone <repository-url>
cd bible_chatbot
```

2. Install Poetry if you haven't already:

```bash
pip install poetry
```

3. Install dependencies:

```bash
poetry install
```

4. Activate the virtual environment:

```bash
poetry shell
```

### Using Conda (Alternative)

1. Create a conda environment:

```bash
conda create -n bible_chatbot python=3.12
conda activate bible_chatbot
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

**Note**: This project has been tested with both Poetry and Conda environments. Poetry is recommended for better dependency management and virtual environment handling.

## Configuration

1. Create a `.env` file in the project root:

```env
# AstraDB Configuration
ASTRADB_ENDPOINT=https://your-database-id-region.astra.datastax.com
ASTRADB_APPLICATION_TOKEN=your-astra-token

# Groq API Key
GROQ_API_KEY=your-groq-api-key

# LangChain Configuration (Optional)
LANGCHAIN_API_KEY=your-langchain-api-key
LANGCHAIN_PROJECT=your-project-name
```

2. Get your AstraDB credentials:

   - Sign up at [AstraDB](https://astra.datastax.com/)
   - Create a new database
   - Copy the endpoint and application token

3. Get your Groq API key:
   - Sign up at [Groq Console](https://console.groq.com/)
   - Generate an API key

## Data Setup

### English Bible

- Place your English Bible PDF in `data/English/whole_bible_niv1984.pdf`
- The system expects the NIV 1984 version, but other versions should work

### Telugu Bible

- Place Telugu Bible PDFs (66 books) in `data/Telugu/` directory
- Name them as `1.pdf`, `2.pdf`, ..., `66.pdf` (corresponding to Bible books)

## Usage

### Building Vector Store

Before using the chatbot, you need to build the vector store for each language:

```python
from src.bible_assistant import BibleAssistant

# For English Bible
assistant = BibleAssistant(language="english")
assistant.build_vector_store()

# For Telugu Bible
assistant = BibleAssistant(language="telugu")
assistant.build_vector_store()
```

Or run directly:

```bash
python src/bible_assistant.py
```

### Running the Web Interface

```bash
streamlit run main.py
```

The application will open in your browser at `http://localhost:8501`.

### Using the Application

1. **Select Language**: Choose between English or Telugu Bible from the sidebar
2. **Ask Questions**: Type your Bible-related questions in the chat input
3. **Get Responses**: The AI will provide contextual answers based on the selected Bible version
4. **Continue Conversations**: Each session maintains chat history for context-aware responses

**Example Questions**:

- "What does John 3:16 say?"
- "Explain the story of David and Goliath"
- "What are the Ten Commandments?"
- "Tell me about Jesus' miracles"

## Technical Details

### Embeddings

- **English**: Uses AstraDB's Vector Service with `sentence-transformers/all-MiniLM-L6-v2`
- **Telugu**: Uses HuggingFace `l3cube-pune/telugu-sentence-bert-nli` model

### Document Processing

- PDFs are automatically loaded and split into chunks of 2000 characters with 200 character overlap
- Each chunk is assigned a unique hash-based ID for efficient retrieval
- Documents are embedded and stored in AstraDB vector collections

### Vector Collections

- `english_bible`: Stores English Bible embeddings
- `telugu_bible`: Stores Telugu Bible embeddings

## Development

### Project Dependencies

The project uses several key libraries:

- **LangChain**: Framework for building LLM applications
- **AstraDB**: Vector database for embeddings storage
- **Streamlit**: Web interface framework
- **PyPDF**: PDF document processing
- **HuggingFace**: Embedding models and transformers

### Logging

Application logs are stored in the `logs/` directory with daily rotation. Check `logs/YYYY-MM-DD/app.log` for detailed execution logs.

## Troubleshooting

### Common Issues

1. **AstraDB Connection Failed**

   - Verify your endpoint and token in `.env`
   - Ensure your database is running and accessible

2. **No PDFs Found**

   - Check that PDF files are in the correct directories
   - Verify file names match expected patterns

3. **Memory Issues**
   - Large PDFs may require significant RAM
   - Consider processing files in smaller batches

### Logs

Check the application logs for detailed error information:

```bash
tail -f logs/$(date +%Y-%m-%d)/app.log
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [LangChain](https://github.com/langchain-ai/langchain) for the RAG framework
- [AstraDB](https://www.datastax.com/products/datastax-astra) for vector storage
- [HuggingFace](https://huggingface.co/) for embedding models
- [Streamlit](https://streamlit.io/) for the web interface

## Support

For questions or issues, please open an issue on GitHub or contact the maintainer.
