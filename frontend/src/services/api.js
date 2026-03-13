import axios from "axios";

const getBaseURL = () => {
  let url = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  if (!url.endsWith("/api") && !url.endsWith("/api/")) {
    url = url.replace(/\/$/, "") + "/api";
  }
  return url;
};

const API = axios.create({
  baseURL: getBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.request.use((req) => {
  const token = sessionStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

// 🔐 Auto-handle 401 errors globally — redirect to login
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("userId");

      // Only redirect if not already on login page
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default API;