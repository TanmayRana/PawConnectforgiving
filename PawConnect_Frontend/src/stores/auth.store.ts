import { create } from "zustand";
import {
  type AuthUser,
  type UserRole,
  getCurrentUser,
  logout as apiLogout,
  getPrimaryRole,
} from "@/lib/api/auth";
import {
  getStoredAccessToken,
  USER_STORAGE_KEY,
  clearStoredTokens,
  ApiError,
} from "@/lib/api/client";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  primaryRole: UserRole | null;
  initialized: boolean;
  setUser: (user: AuthUser | null) => void;
  init: () => Promise<void>;
  logout: () => Promise<void>;
}

function getCachedUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = localStorage.getItem(USER_STORAGE_KEY);
    return cached ? (JSON.parse(cached) as AuthUser) : null;
  } catch {
    return null;
  }
}

let initPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isRefreshing: false,
  primaryRole: null,
  initialized: false,

  setUser: (user) => {
    if (typeof window !== "undefined") {
      if (user) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
    set({
      user,
      isAuthenticated: Boolean(user),
      primaryRole: user ? getPrimaryRole(user) : null,
      initialized: true,
    });
  },

  init: async () => {
    // If an initialization is already in flight, reuse the same promise
    if (initPromise) {
      return initPromise;
    }

    // If already initialized with a user and not refreshing, avoid redundant re-fetch
    if (get().initialized && get().user && !get().isRefreshing) {
      return;
    }

    initPromise = (async () => {
      try {
        const token = getStoredAccessToken();
        const cachedUser = getCachedUser();

        if (!token) {
          if (get().user && typeof window !== "undefined") {
            localStorage.removeItem(USER_STORAGE_KEY);
          }
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isRefreshing: false,
            primaryRole: null,
            initialized: true,
          });
          return;
        }

        if (cachedUser) {
          // If store didn't have user in state, set it immediately
          if (!get().user) {
            set({
              user: cachedUser,
              isAuthenticated: true,
              primaryRole: getPrimaryRole(cachedUser),
            });
          }
          // Revalidate in background without setting isLoading = true
          set({ isRefreshing: true, initialized: true, isLoading: false });
          try {
            const liveUser = await getCurrentUser();
            get().setUser(liveUser);
          } catch (err) {
            // ONLY clear tokens if the backend explicitly rejected the credentials with 401 Unauthorized or 403 Forbidden.
            // Do NOT log the user out on network failure (status 0), server errors (5xx), or temporary outages.
            const status = err instanceof ApiError ? err.status : (err as { status?: number })?.status;
            if (status === 401 || status === 403) {
              console.warn("Session invalidated by server (401/403). Clearing session.");
              clearStoredTokens();
              get().setUser(null);
            } else {
              console.warn("Failed to revalidate user session in background, preserving cached session:", err);
            }
          } finally {
            set({ isRefreshing: false, initialized: true });
          }
          return;
        }

        // No cached user AND token exists: show blocking loader
        set({ isLoading: true, initialized: true });
        try {
          const liveUser = await getCurrentUser();
          get().setUser(liveUser);
        } catch (err) {
          const status = err instanceof ApiError ? err.status : (err as { status?: number })?.status;
          if (status === 401 || status === 403) {
            console.warn("User fetch rejected by server (401/403). Clearing session.");
            clearStoredTokens();
            get().setUser(null);
          } else {
            console.warn("Failed to load user session, preserving tokens:", err);
          }
        } finally {
          set({ isLoading: false, initialized: true });
        }
      } finally {
        initPromise = null;
      }
    })();

    return initPromise;
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await apiLogout();
    } catch {
      // ignore
    } finally {
      get().setUser(null);
      set({ isLoading: false, isRefreshing: false });
    }
  },
}));

// Setup window event listener for auth events
if (typeof window !== "undefined") {
  window.addEventListener("pawconnect-auth-cleared", () => {
    useAuthStore.getState().setUser(null);
  });

  window.addEventListener("pawconnect-token-refreshed", () => {
    // Optionally refresh user profile
    if (!useAuthStore.getState().user) {
      useAuthStore.getState().init();
    }
  });
}
