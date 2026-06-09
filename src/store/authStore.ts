import { create } from "zustand";
import { authApi, storage, getApiError, authEventEmitter } from "@/api";
import type {
  UserProfile,
  CustomerProfileData,
  SellerProfileData,
  LoginPayload,
  RegisterPayload,
} from "@/api";

type Profile = CustomerProfileData | SellerProfileData | null;

interface AuthState {
  user: UserProfile | null;
  profile: Profile;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;   // true once rehydrate() has finished (success or failure)
  error: string | null;

  login: (payload: LoginPayload) => Promise<void>;
  registerCustomer: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  updateProfile: (updates: Partial<CustomerProfileData>) => Promise<void>;
  changePassword: (currentPw: string, newPw: string) => Promise<void>;
  clearError: () => void;
  rehydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Forced logout when the token refresh fails
  authEventEmitter.on("logout", () => get().logout());

  return {
    user: null,
    profile: null,
    isAuthenticated: false,
    isLoading: false,
    hasHydrated: false,
    error: null,

    clearError: () => set({ error: null }),

    // Called once on app launch — restores session from SecureStore
    rehydrate: async () => {
      try {
        const token = await storage.getAccessToken();
        if (token) {
          const { user, profile } = await authApi.getMe();
          set({ user, profile, isAuthenticated: true });
        }
      } catch {
        // Token invalid or expired — clear it and stay logged out
        await storage.clearTokens();
        set({ user: null, profile: null, isAuthenticated: false });
      } finally {
        // Always mark hydration complete so layouts can make routing decisions
        set({ hasHydrated: true });
      }
    },

    login: async (payload) => {
      set({ isLoading: true, error: null });
      try {
        await authApi.login(payload);
        const { user, profile } = await authApi.getMe();
        set({ user, profile, isAuthenticated: true, isLoading: false });
      } catch (e) {
        set({ isLoading: false, error: getApiError(e) });
        throw e;
      }
    },

    registerCustomer: async (payload) => {
      set({ isLoading: true, error: null });
      try {
        await authApi.registerCustomer(payload);
        // Don't set isAuthenticated — user must verify email first
        set({ isLoading: false });
      } catch (e) {
        set({ isLoading: false, error: getApiError(e) });
        throw e;
      }
    },

    logout: async () => {
      await authApi.logout();
      set({ user: null, profile: null, isAuthenticated: false, error: null });
    },

    fetchMe: async () => {
      set({ isLoading: true });
      try {
        const { user, profile } = await authApi.getMe();
        set({ user, profile, isAuthenticated: true, isLoading: false });
      } catch (e) {
        set({ isLoading: false, error: getApiError(e) });
      }
    },

    updateProfile: async (updates) => {
      set({ isLoading: true, error: null });
      try {
        await authApi.updateProfile(updates);
        await get().fetchMe();
      } catch (e) {
        set({ isLoading: false, error: getApiError(e) });
        throw e;
      }
    },

    changePassword: async (currentPw, newPw) => {
      set({ isLoading: true, error: null });
      try {
        await authApi.changePassword(currentPw, newPw);
        set({ isLoading: false });
      } catch (e) {
        set({ isLoading: false, error: getApiError(e) });
        throw e;
      }
    },
  };
});
