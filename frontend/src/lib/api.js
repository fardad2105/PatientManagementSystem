import axios from "axios";

export const api = axios.create({
  baseURL: `${process.env.REACT_APP_BACKEND_URL}/api`,
  withCredentials: true,
});

const NO_REFRESH = ["/auth/login", "/auth/register", "/auth/refresh"];
let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retry && !NO_REFRESH.includes(original.url)) {
      original._retry = true;
      refreshing = refreshing || api.post("/auth/refresh").finally(() => { refreshing = null; });
      try {
        await refreshing;
        return api(original);
      } catch {
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);

export function apiError(err) {
  const detail = err?.response?.data?.detail;
  if (detail == null) return "خطایی رخ داد. لطفاً دوباره تلاش کنید.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return "برخی از مقادیر واردشده معتبر نیستند. لطفاً فرم را بررسی کنید.";
  return String(detail);
}

export const homeFor = (role) => ({ patient: "/patient", physician: "/physician", admin: "/admin" }[role] || "/login");
