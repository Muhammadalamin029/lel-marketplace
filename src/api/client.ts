import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { storage } from "./storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export interface ApiEnvelope<T> {
  success?: boolean;
  status?: boolean;
  message?: string;
  data?: T;
  pagination?: Pagination;
  meta?: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

// ── Main axios instance ──────────────────────────────────────────────────────

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: attach access token ─────────────────────────────────

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await storage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Endpoints that never carry a usable session — a 401 here is the real
// answer (e.g. wrong password), not a signal to rotate tokens (web parity:
// web only refreshes when a refresh token actually exists).
const NO_REFRESH_URLS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/google",
  "/auth/request-password-reset",
  "/auth/reset-password",
  "/auth/verify-email",
  "/auth/send-verification",
  "/auth/resend-verification",
];

function shouldAttemptRefresh(url: string | undefined): boolean {
  if (!url) return true;
  return !NO_REFRESH_URLS.some((p) => url.includes(p));
}

let isRefreshing = false;
let failedQueue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => (token ? p.resolve(token) : p.reject(error)));
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    // Never rewrite auth failures (login/register/refresh/verify): surface the
    // backend's message (e.g. "Invalid email or password") instead of a
    // misleading "No refresh token".
    if (!shouldAttemptRefresh(original.url)) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await storage.getRefreshToken();
      // No session to rotate (e.g. logged-out request hit 401) — keep the
      // original error so the UI shows the real reason.
      if (!refreshToken) return Promise.reject(error);

      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
        refresh_token: refreshToken,
      });

      const { access_token, refresh_token } = data;
      await storage.setTokens(access_token, refresh_token);

      api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
      processQueue(null, access_token);
      original.headers.Authorization = `Bearer ${access_token}`;
      return api(original);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await storage.clearTokens();
      // Signal to the auth store to log out
      authEventEmitter.emit("logout");
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

// ── Tiny event emitter for auth events (no external dependency needed) ────────

type Listener = () => void;
const _listeners: Record<string, Listener[]> = {};

export const authEventEmitter = {
  on(event: string, fn: Listener) {
    _listeners[event] = _listeners[event] ?? [];
    _listeners[event].push(fn);
    return () => this.off(event, fn);
  },
  off(event: string, fn: Listener) {
    _listeners[event] = (_listeners[event] ?? []).filter((l) => l !== fn);
  },
  emit(event: string) {
    (_listeners[event] ?? []).forEach((fn) => fn());
  },
};

// ── Helper: extract readable error message from backend responses ─────────────

export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data?.detail === "string") return data.detail;
    if (Array.isArray(data?.detail)) {
      const msg = data.detail[0]?.msg;
      if (msg) return msg;
    }
    // FastAPI 422s are wrapped in the backend's {success, message, data} envelope,
    // with per-field errors nested at data.validation_errors[].msg.
    const validationErrors = data?.data?.validation_errors;
    if (Array.isArray(validationErrors) && validationErrors[0]?.msg) {
      return validationErrors[0].msg as string;
    }
    if (typeof data?.message === "string") return data.message;
    if (error.code === "ECONNABORTED") return "Request timed out. Check your connection.";
    if (!error.response) return "Could not reach the server. Check your internet connection.";
    if (error.response.status >= 500) return "Server error. Please try again later.";
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export function unwrapData<T>(payload: ApiEnvelope<T> | T): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as ApiEnvelope<T>).data as T;
  }
  return payload as T;
}

export function unwrapList<T>(payload: ApiEnvelope<T[]> | T[]): T[] {
  const data = unwrapData<T[]>(payload);
  return Array.isArray(data) ? data : [];
}

export function getPagination(payload: ApiEnvelope<unknown>): Pagination {
  return (
    payload.pagination ??
    payload.meta ?? {
      page: 1,
      limit: Array.isArray(payload.data) ? payload.data.length : 0,
      total: Array.isArray(payload.data) ? payload.data.length : 0,
      total_pages: 1,
    }
  );
}
