// API Configuration
export const API_CONFIG = {
  // Backend API base URL
  BASE_URL:
    import.meta.env.VITE_API_URL ||
    "https://bible-chatbot-backend.up.railway.app",

  // Timeout for API requests (in milliseconds)
  TIMEOUT: 30000,
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  TOKEN: "/token",
  SIGNUP: "/signup",
  USERS_ME: "/users/me",
  ME: "/me",

  // Conversation endpoints
  CONVERSATIONS: "/conversations",
  GET_MESSAGES: "/get_messages",

  // Query endpoint
  QUERY: "/query",
} as const;
