import axios from "axios";
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;


const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`,
});

// for the deployment

// ⭐ REQUEST INTERCEPTOR → add headers to every request
api.interceptors.request.use(
  (config) => {
    // --- ROUTES WHERE TOKEN SHOULD NOT BE ATTACHED ---
    const publicRoutes = ["/login", "/signup"];

    // Skip token for public routes
    const isPublic = publicRoutes.some((route) => config.url?.includes(route));

    if (!isPublic) {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ⭐ RESPONSE INTERCEPTOR → GLOBAL ERROR HANDLER
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // 🛑 JWT EXPIRED OR UNAUTHORIZED → REDIRECT TO LOGIN
    if (status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }

    // 🛑 SERVER DOWN OR CRASHED → SERVICE UNAVAILABLE PAGE
    // if (status >= 500) {
    //   if (typeof window !== "undefined") {
    //     window.location.href = "/service-unavailable";
    //   }
    // }

    return Promise.reject(error);
  }
);

export default api;
