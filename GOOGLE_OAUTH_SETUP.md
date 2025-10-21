# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for the Bible Chatbot application.

## Prerequisites

- Google Cloud Platform account
- Node.js and npm installed
- Python 3.12+ installed

## Step 1: Create Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API**:

   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application"
   - Add authorized JavaScript origins:
     - `http://localhost:5173` (Vite dev server)
     - `http://localhost:3000` (if using different port)
   - Add authorized redirect URIs:
     - `http://localhost:5173`
     - `http://localhost:3000`
   - Click "Create"
   - Copy the **Client ID** (you'll need this)

## Step 2: Backend Configuration

1. **Install Python dependencies:**

   ```bash
   cd backend
   pip install google-auth google-auth-oauthlib google-auth-httplib2
   ```

   Or if using poetry:

   ```bash
   poetry install
   ```

2. **Update your `.env` file** in the project root:

   ```env
   # Add these lines
   GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
   ```

3. **Update database schema:**

   The User model has been updated with new fields for OAuth support. You'll need to update your database:

   **Option 1: Drop and recreate tables (development only):**

   ```python
   # In Python shell or script
   from backend.database import Base, engine
   Base.metadata.drop_all(bind=engine)
   Base.metadata.create_all(bind=engine)
   ```

   **Option 2: Manual SQL migration (recommended for production):**

   ```sql
   ALTER TABLE users
   MODIFY COLUMN password_hash VARCHAR(256) NULL,
   ADD COLUMN auth_provider VARCHAR(20) NOT NULL DEFAULT 'local',
   ADD COLUMN google_id VARCHAR(100) UNIQUE NULL;
   ```

## Step 3: Frontend Configuration

1. **Install npm dependencies:**

   ```bash
   cd frontend
   npm install
   ```

2. **Create `.env` file** in the `frontend` directory:

   ```env
   VITE_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
   ```

   Note: Use the same Client ID from Step 1.

## Step 4: Test the Implementation

1. **Start the backend:**

   ```bash
   cd backend
   python app.py
   # or
   uvicorn app:app --reload
   ```

2. **Start the frontend:**

   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Google Sign-In:**
   - Navigate to `http://localhost:5173/signin`
   - Click "Continue with Google"
   - Select your Google account
   - You should be redirected to the dashboard

## How It Works

### Authentication Flow

1. User clicks "Continue with Google" button
2. Frontend opens Google OAuth consent screen
3. User authenticates with Google
4. Google returns an access token to frontend
5. Frontend sends the access token and user info to backend `/auth/google` endpoint
6. Backend verifies the Google user info and:
   - Creates a new user if email doesn't exist
   - Updates existing user to Google auth if they were using local auth
   - Returns a JWT token for the session
7. Frontend stores the JWT token and user info
8. User is redirected to dashboard

### Database Changes

The User model now includes:

- `auth_provider`: Either "local" or "google"
- `google_id`: Google user ID (sub from Google)
- `password_hash`: Now nullable for OAuth users

### Security Notes

- Google access tokens are verified through Google's API
- User information is extracted from Google's userinfo endpoint
- Backend generates its own JWT tokens for session management
- Existing local users can seamlessly upgrade to Google auth

## Troubleshooting

### "Redirect URI mismatch" error

- Make sure your authorized redirect URIs in Google Cloud Console match your frontend URL exactly
- Common URLs: `http://localhost:5173`, `http://localhost:3000`

### "Invalid client" error

- Verify your `GOOGLE_CLIENT_ID` is correct in both backend and frontend `.env` files
- Make sure the Client ID matches your Google Cloud Console credentials

### Database errors

- Run database migrations to add new columns
- Check that `password_hash` is now nullable

### Frontend errors about missing module

- Run `npm install` in the frontend directory
- Check that `@react-oauth/google` is in package.json

## Environment Variables Summary

### Backend `.env`:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
SECRET_KEY=your-secret-key
DATABASE_URL=your-database-url
# ... other existing variables
```

### Frontend `.env`:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [@react-oauth/google Documentation](https://www.npmjs.com/package/@react-oauth/google)
