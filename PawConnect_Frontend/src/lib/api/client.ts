/**
 * Central Typed HTTP Client for PawConnect
 * Connects to Spring Boot Backend with automatic token injection,
 * ApiResponse/PageResponse unwrapping, transparent JWT refresh token rotation,
 * and structured error handling.
 */

const RAW_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000/api"
).replace(/\/+$/, "");

export const API_BASE_URL = RAW_BASE_URL.endsWith("/api")
  ? RAW_BASE_URL
  : `${RAW_BASE_URL}/api`;

export const TOKEN_STORAGE_KEY = "pawconnect_access_token";
export const REFRESH_TOKEN_STORAGE_KEY = "pawconnect_refresh_token";
export const USER_STORAGE_KEY = "pawconnect_user";

export interface ApiResponse<T> {
  success: boolean;
  code: string;
  message: string;
  data: T;
  meta?: {
    requestId?: string;
    [key: string]: unknown;
  };
  errors?: string[];
  timestamp?: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  sort?: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public errors?: string[],
    public data?: unknown,
    public requestId?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function setStoredTokens(accessToken: string, refreshToken?: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  }
}

export function clearStoredTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
  window.dispatchEvent(new Event("pawconnect-auth-cleared"));
}

export interface RequestOptions extends RequestInit {
  token?: string;
  unwrap?: boolean;
  skipRefresh?: boolean;
  params?: Record<string, string | number | boolean | null | undefined>;
}

// ─── Token Expiration & Proactive Refresh Helpers ───────────────────────────

export function isTokenExpiringSoon(token: string, bufferSeconds = 60): boolean {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return false;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr =
      typeof window !== "undefined" && typeof window.atob === "function"
        ? window.atob(base64)
        : Buffer.from(base64, "base64").toString("utf-8");
    const payload = JSON.parse(jsonStr) as { exp?: number };
    if (!payload.exp) return false;
    return payload.exp * 1000 - bufferSeconds * 1000 <= Date.now();
  } catch {
    return false;
  }
}

// ─── Token Refresh Concurrency Queue ──────────────────────────────────────────

let refreshPromise: Promise<string | null> | null = null;

export async function refreshAuthToken(): Promise<string | null> {
  const currentRefreshToken = getStoredRefreshToken();
  if (!currentRefreshToken) {
    return null;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken: currentRefreshToken }),
    });

    // ONLY clear tokens if the backend explicitly rejected the refresh token as 401 Unauthorized or 403 Forbidden
    if (res.status === 401 || res.status === 403) {
      console.warn("Refresh token rejected by server (401/403). Clearing session.");
      clearStoredTokens();
      return null;
    }

    if (!res.ok) {
      // 5xx, 429 - Temporary backend hiccup or Neon database wake-up.
      // Do NOT clear stored tokens so user is not logged out during transient outages!
      console.warn(`Token refresh failed with status ${res.status}. Keeping tokens intact.`);
      return null;
    }

    const payload = (await res.json()) as ApiResponse<{
      accessToken: string;
      refreshToken?: string;
      user?: unknown;
    }>;

    if (payload.success && payload.data?.accessToken) {
      setStoredTokens(payload.data.accessToken, payload.data.refreshToken);
      window.dispatchEvent(
        new CustomEvent("pawconnect-token-refreshed", {
          detail: { accessToken: payload.data.accessToken },
        })
      );
      return payload.data.accessToken;
    }

    return null;
  } catch (err) {
    // Network offline / socket reset: Keep session intact!
    console.warn("Token refresh network failure. Keeping tokens intact.", err);
    return null;
  } finally {
    refreshPromise = null;
  }
}

// ─── Query Parameters Formatter ───────────────────────────────────────────────

function buildQueryString(params?: Record<string, string | number | boolean | null | undefined>): string {
  if (!params) return "";
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

const inFlightGetRequests = new Map<string, Promise<unknown>>();

async function executeRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, unwrap = true, skipRefresh = false, params, headers, ...init } = options;

  let activeToken = token || getStoredAccessToken();

  // Proactively refresh expiring token before making authenticated calls
  if (!token && !skipRefresh && !path.startsWith("/auth/")) {
    const stored = getStoredAccessToken();
    if (stored && isTokenExpiringSoon(stored, 60) && getStoredRefreshToken()) {
      if (!refreshPromise) {
        refreshPromise = refreshAuthToken();
      }
      const refreshed = await refreshPromise;
      if (refreshed) {
        activeToken = refreshed;
      }
    }
  }

  const queryString = buildQueryString(params);
  const rawPath = path.startsWith("/") ? path : `/${path}`;
  const normalizedPath = rawPath.startsWith("/api/")
    ? rawPath.slice(4)
    : rawPath === "/api"
    ? ""
    : rawPath;
  const fullUrl = `${API_BASE_URL}${normalizedPath}${queryString}`;

  const requestHeaders = new Headers(headers);
  if (!requestHeaders.has("Content-Type") && !(init.body instanceof FormData)) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (activeToken && !requestHeaders.has("Authorization")) {
    requestHeaders.set("Authorization", `Bearer ${activeToken}`);
  }

  let response: Response;
  try {
    response = await fetch(fullUrl, {
      ...init,
      headers: requestHeaders,
    });
  } catch (error) {
    throw new ApiError(0, "Network failure. Please check your connection.", "NETWORK_ERROR", undefined, error);
  }

  // Handle 401 Unauthorized with single token refresh attempt
  if (response.status === 401 && !skipRefresh && !normalizedPath.startsWith("/auth/")) {
    if (!refreshPromise) {
      refreshPromise = refreshAuthToken();
    }
    const newAccessToken = await refreshPromise;

    if (newAccessToken) {
      return request<T>(path, {
        ...options,
        token: newAccessToken,
        skipRefresh: true,
      });
    }
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    let code: string | undefined;
    let errors: string[] | undefined;
    let data: unknown;
    let requestId: string | undefined;

    try {
      const errorJson = (await response.json()) as ApiResponse<unknown>;
      if (typeof errorJson === "object" && errorJson !== null) {
        if (errorJson.message) message = errorJson.message;
        if (errorJson.code) code = errorJson.code;
        if (Array.isArray(errorJson.errors) && errorJson.errors.length > 0) {
          errors = errorJson.errors;
        }
        if (errorJson.meta?.requestId) {
          requestId = String(errorJson.meta.requestId);
        }
        data = errorJson.data;
      }
    } catch {
      // Body not JSON
    }

    throw new ApiError(response.status, message, code, errors, data, requestId);
  }

  // 204 No Content
  if (response.status === 204) {
    return null as T;
  }

  let jsonResult: unknown;
  try {
    jsonResult = await response.json();
  } catch {
    return null as T;
  }

  if (unwrap && typeof jsonResult === "object" && jsonResult !== null && "success" in jsonResult) {
    const wrapped = jsonResult as ApiResponse<T>;
    return wrapped.data as T;
  }

  return jsonResult as T;
}

// ─── Main Request Dispatcher (With In-flight GET Deduplication) ───────────────

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const isGet = method === "GET";

  if (isGet) {
    const activeToken = options.token || getStoredAccessToken();
    const queryString = buildQueryString(options.params);
    const rawPath = path.startsWith("/") ? path : `/${path}`;
    const normalizedPath = rawPath.startsWith("/api/")
      ? rawPath.slice(4)
      : rawPath === "/api"
      ? ""
      : rawPath;
    const dedupKey = `${activeToken || "anon"}:${normalizedPath}${queryString}`;

    const existing = inFlightGetRequests.get(dedupKey);
    if (existing) {
      return existing as Promise<T>;
    }

    const promise = executeRequest<T>(path, options).finally(() => {
      inFlightGetRequests.delete(dedupKey);
    });

    inFlightGetRequests.set(dedupKey, promise);
    return promise;
  }

  return executeRequest<T>(path, options);
}

// ─── HTTP Method Helpers ──────────────────────────────────────────────────────

export function apiGet<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return request<T>(path, { ...options, method: "GET" });
}

export function apiPost<T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
  const isFormData = body instanceof FormData;
  return request<T>(path, {
    ...options,
    method: "POST",
    body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function apiPut<T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
  const isFormData = body instanceof FormData;
  return request<T>(path, {
    ...options,
    method: "PUT",
    body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function apiPatch<T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
  const isFormData = body instanceof FormData;
  return request<T>(path, {
    ...options,
    method: "PATCH",
    body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function apiDelete<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return request<T>(path, { ...options, method: "DELETE" });
}

// ─── Proactive Auto-Refresh on Tab Visibility & Focus ─────────────────────────

if (typeof window !== "undefined") {
  const checkAndRefreshToken = () => {
    const token = getStoredAccessToken();
    const refreshToken = getStoredRefreshToken();
    if (token && refreshToken && isTokenExpiringSoon(token, 120)) {
      if (!refreshPromise) {
        refreshPromise = refreshAuthToken();
      }
    }
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      checkAndRefreshToken();
    }
  });

  window.addEventListener("focus", () => {
    checkAndRefreshToken();
  });
}

