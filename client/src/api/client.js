import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

// attach the login token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// if the token is no longer valid, send the user back to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginCall = err.config?.url?.includes("/auth/login");
    if (err.response?.status === 401 && !isLoginCall) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// turns an axios error into a message we can show on screen
export function getErrorMessage(err) {
  const data = err.response?.data;
  if (data?.details?.length) return data.details.map((d) => d.message).join(", ");
  return data?.error || "Could not reach the server. Please try again.";
}

export default api;
