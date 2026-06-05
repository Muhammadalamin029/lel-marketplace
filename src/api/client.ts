import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { storage } from "./storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

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

// ── Response interceptor: silent token refresh on 401 ────────────────────────

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
      if (!refreshToken) throw new Error("No refresh token");

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
    if (typeof data?.message === "string") return data.message;
    if (error.code === "ECONNABORTED") return "Request timed out. Check your connection.";
    if (!error.response) return "Could not reach the server. Check your internet connection.";
    if (error.response.status >= 500) return "Server error. Please try again later.";
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
