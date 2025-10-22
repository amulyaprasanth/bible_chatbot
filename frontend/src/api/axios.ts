import type { InternalAxiosRequestConfig } from "axios";
import axios, { AxiosError } from "axios";
import { API_CONFIG } from "./config";

// Create axios instance for backend
export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Log the API configuration for debugging
console.log(
  `🔗 API Client initialized in ${API_CONFIG.MODE} mode`,
  `\n📡 Backend URL: ${API_CONFIG.BASE_URL}`
);

// Request interceptor to add auth token
const authInterceptor = (config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("access_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// Response error interceptor
const errorInterceptor = (error: AxiosError) => {
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;

    switch (status) {
      case 401:
        // Unauthorized - clear token and redirect to login
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        globalThis.location.href = "/signin";
        break;
      case 403:
        console.error("Access forbidden");
        break;
      case 404:
        console.error("Resource not found");
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        console.error("Server error:", error.message);
        // You could show a toast notification here
        break;
      default:
        console.error("API Error:", error.message);
    }
  } else if (error.request) {
    // Request made but no response (network error, CORS, etc.)
    console.error("Network error or CORS issue:", error.message);
    // Could be CORS, network down, or backend not responding
  } else {
    // Something else happened
    console.error("Request setup error:", error.message);
  }

  return Promise.reject(error);
};

// Add interceptors
apiClient.interceptors.request.use(authInterceptor);
apiClient.interceptors.response.use((response) => response, errorInterceptor);
