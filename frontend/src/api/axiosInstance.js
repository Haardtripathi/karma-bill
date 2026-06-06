import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api",
  timeout: 30000
});

axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const data = error.response?.data;
    let message = data?.message || error.message || "Request failed";
    if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      message = `${message}: ${data.errors.join(", ")}`;
    }
    return Promise.reject(new Error(message));
  }
);

export default axiosInstance;
