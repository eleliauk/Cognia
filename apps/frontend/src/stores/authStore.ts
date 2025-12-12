import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type UserRole = 'TEACHER' | 'STUDENT' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  lastActivity: number | null;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  login: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  updateUser: (updates: Partial<User>) => void;
  updateLastActivity: () => void;
  clearAuth: () => void;
}

type AuthStore = AuthState & AuthActions;

// Session timeout in milliseconds (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      isRefreshing: false,
      lastActivity: null,

      // Actions
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setTokens: (tokens) => set({ tokens }),

      login: (user, tokens) =>
        set({
          user,
          tokens,
          isAuthenticated: true,
          isLoading: false,
          lastActivity: Date.now(),
        }),

      logout: () => {
        // Clear all auth state
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
          isRefreshing: false,
          lastActivity: null,
        });
      },

      setLoading: (isLoading) => set({ isLoading }),

      setRefreshing: (isRefreshing) => set({ isRefreshing }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      updateLastActivity: () => set({ lastActivity: Date.now() }),

      clearAuth: () =>
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
          isRefreshing: false,
          lastActivity: null,
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
        lastActivity: state.lastActivity,
      }),
      // Rehydrate and check session validity
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Check if session has expired
          const lastActivity = state.lastActivity;
          if (lastActivity && Date.now() - lastActivity > SESSION_TIMEOUT) {
            // Session expired, clear auth
            state.clearAuth();
          }
        }
      },
    }
  )
);

// Helper function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  const state = useAuthStore.getState();
  return state.isAuthenticated && !!state.tokens?.accessToken;
};

// Helper function to get current user
export const getCurrentUser = (): User | null => {
  return useAuthStore.getState().user;
};

// Helper function to get access token
export const getAccessToken = (): string | null => {
  return useAuthStore.getState().tokens?.accessToken || null;
};

// Helper function to get refresh token
export const getRefreshToken = (): string | null => {
  return useAuthStore.getState().tokens?.refreshToken || null;
};
