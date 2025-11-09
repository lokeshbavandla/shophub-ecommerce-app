import axios from "axios";

// Axios instance configured for production and development
// withCredentials: Required for sending HTTP-only cookies (authentication tokens)
const axiosInstance = axios.create({
  baseURL: import.meta.mode === "development" ? "http://localhost:4000/api" : "/api",
  withCredentials: true,
});

export default axiosInstance;
