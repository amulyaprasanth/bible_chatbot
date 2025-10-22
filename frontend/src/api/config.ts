// API Configuration
// Environment-based API URL:
// - Development mode: http://localhost:8000 (from .env.development)
// - Production mode: https://bible-chatbot-backend.up.railway.app (from .env.production)

export const API_CONFIG = {
  // Backend API base URL - automatically switches based on mode
  BASE_URL: import.meta.env.VITE_API_URL || "https://bible-chatbot-backend.up.railway.app",

  // Timeout for API requests (in milliseconds)
  TIMEOUT: 30000,

  // Current mode for debugging
  MODE: import.meta.env.MODE,
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  TOKEN: "/token",
  SIGNUP: "/signup",
  USERS_ME: "/users/me",

  // Conversation endpoints
  CONVERSATIONS: "/conversations",
  GET_MESSAGES: "/get_messages",

  // Query endpoint
  QUERY: "/query",
} as const;
