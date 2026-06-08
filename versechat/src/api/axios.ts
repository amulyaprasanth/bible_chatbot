import axios from "axios";


const rawBaseURL =
  import.meta.env.VITE_LOCAL_API_URL || import.meta.env.VITE_PROD_API_URL;

if (!rawBaseURL) {
  throw new Error(
    "No API URL configured. Set VITE_LOCAL_API_URL or VITE_PROD_API_URL in your .env file.",
  );
}

const baseURL = rawBaseURL.startsWith("http")
  ? rawBaseURL
  : `https://${rawBaseURL}`;


if (!baseURL) {
  throw new Error(
    "No API URL configured. Set VITE_LOCAL_API_URL or VITE_PROD_API_URL in your .env file.",
  );
}

const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 15000,
});

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: () => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown = null) => {
  refreshQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(),
  );
  refreshQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      if (originalRequest.url?.includes("/auth/")) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({
            resolve: () => resolve(api(originalRequest)),
            reject: (err) => reject(err),
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post("/auth/refresh");
        processQueue();
        isRefreshing = false;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        isRefreshing = false;
        globalThis.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
