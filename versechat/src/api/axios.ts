import axios from "axios";

const api = axios.create({
  baseURL: "https://bible-chatbot-backend.up.railway.app/",
  withCredentials: true, // include cookies
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (
      error.response?.status === 401 &&
      error.response?.data.detail === "expired"
    ) {
      try {
        await api.post("/auth/refresh");
        // retry the original request
        return api(error.config);
      } catch (err) {
        console.error("Refresh failed, logging out", err);
        globalThis.location.href = "/login";
      }
    }
    throw error;
  }
);

export default api;
