# Bible Chatbot Setup Guide

## Prerequisites

1. **Python 3.12+** installed
2. **Node.js 18+** installed
3. **MySQL** database running
4. **Environment variables** configured

## Backend Setup

1. **Install Python dependencies:**

   ```bash
   pip install -r requirements.txt
   # OR using poetry
   poetry install
   ```

2. **Configure environment variables:**
   Create a `.env` file in the project root with:

   ```env
   # Database Configuration
   DB_USER=root
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=bible_chat

   # JWT Configuration
   SECRET_KEY=your-secret-key-here
   ALGORITHM=HS256

   # AI/ML Configuration
   GROQ_API_KEY=your-groq-api-key-here
   LANGCHAIN_API_KEY=your-langchain-api-key-here
   LANGCHAIN_PROJECT=your-langchain-project-name

   # AstraDB Configuration
   ASTRADB_ENDPOINT=your-astradb-endpoint-here
   ASTRADB_APPLICATION_TOKEN=your-astradb-token-here
   ```

3. **Create MySQL database:**

   ```sql
   CREATE DATABASE bible_chat;
   ```

4. **Start the backend:**
   ```bash
   python start_backend.py
   # OR
   uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
   ```

## Frontend Setup

1. **Navigate to frontend directory:**

   ```bash
   cd frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

## Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs

## Features Fixed

✅ **Backend Issues Fixed:**

- Added missing `/conversations` endpoint
- Fixed sender type consistency (USER/assistant)
- Added database table creation
- Fixed datetime usage (replaced deprecated `utcnow()`)
- Added message persistence to database

✅ **Frontend Issues Fixed:**

- Fixed language field in conversation interface
- Fixed accessibility issues (replaced divs with buttons)
- Fixed deprecated `onKeyPress` to `onKeyDown`
- Fixed type inconsistencies
- Updated package.json dependencies

✅ **Integration Issues Fixed:**

- Frontend now sends `conv_id` in query requests
- Backend properly saves messages to database
- Consistent API responses between frontend and backend

## Troubleshooting

1. **Database Connection Issues:**

   - Ensure MySQL is running
   - Check database credentials in `.env`
   - Verify database exists

2. **API Key Issues:**

   - Ensure all required API keys are set in `.env`
   - Check Groq API key is valid
   - Verify AstraDB credentials

3. **Frontend Build Issues:**
   - Run `npm install` to ensure all dependencies are installed
   - Check Node.js version compatibility
