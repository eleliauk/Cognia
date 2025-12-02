import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { authService } from '@/services';
import { getDashboardPath } from '@/router';
import { toast } from '@/hooks/useToast';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: 'TEACHER' | 'STUDENT';
  phone?: string;
}

// Token refresh interval (14 minutes - before 15 min expiry)
const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000;

// Activity check interval (1 minute)
const ACTIVITY_CHECK_INTERVAL = 60 * 1000;

// Session timeout (30 minutes of inactivity)
const SESSION_TIMEOUT = 30 * 60 * 1000;

export function useAuth() {
  const navigate = useNavigate();
  const {
    user,
    tokens,
    isAuthenticated,
    isLoading,
    isRefreshing,
    lastActivity,
    login,
    logout: storeLogout,
    setLoading,
    setRefreshing,
    setTokens,
    updateLastActivity,
    clearAuth,
  } = useAuthStore();

  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activityTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Refresh token function
  const refreshToken = useCallback(async () => {
    if (!tokens?.refreshToken || isRefreshing) {
      return false;
    }

    setRefreshing(true);
    try {
      const response = await authService.refreshToken(tokens.refreshToken);
      if (response.success && response.data) {
        setTokens({
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    } finally {
      setRefreshing(false);
    }
  }, [tokens?.refreshToken, isRefreshing, setRefreshing, setTokens]);

  // Check session validity
  const checkSession = useCallback(() => {
    if (!isAuthenticated || !lastActivity) {
      return;
    }

    const timeSinceActivity = Date.now() - lastActivity;
    if (timeSinceActivity > SESSION_TIMEOUT) {
      // Session expired due to inactivity
      clearAuth();
      toast.warning({
        title: '会话已过期',
        description: '由于长时间未操作，请重新登录',
      });
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, lastActivity, clearAuth, navigate]);

  // Set up token refresh timer
  useEffect(() => {
    if (isAuthenticated && tokens?.refreshToken) {
      // Clear existing timer
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }

      // Set up new refresh timer
      refreshTimerRef.current = setInterval(() => {
        refreshToken();
      }, TOKEN_REFRESH_INTERVAL);

      return () => {
        if (refreshTimerRef.current) {
          clearInterval(refreshTimerRef.current);
        }
      };
    }
  }, [isAuthenticated, tokens?.refreshToken, refreshToken]);

  // Set up activity check timer
  useEffect(() => {
    if (isAuthenticated) {
      // Clear existing timer
      if (activityTimerRef.current) {
        clearInterval(activityTimerRef.current);
      }

      // Set up activity check timer
      activityTimerRef.current = setInterval(() => {
        checkSession();
      }, ACTIVITY_CHECK_INTERVAL);

      return () => {
        if (activityTimerRef.current) {
          clearInterval(activityTimerRef.current);
        }
      };
    }
  }, [isAuthenticated, checkSession]);

  // Track user activity
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const handleActivity = () => {
      updateLastActivity();
    };

    // Listen for user activity events
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isAuthenticated, updateLastActivity]);

  const handleLogin = useCallback(
    async (credentials: LoginCredentials) => {
      setLoading(true);
      try {
        const response = await authService.login(credentials);
        if (response.success && response.data) {
          const { user, accessToken, refreshToken } = response.data;
          login(user, { accessToken, refreshToken });
          navigate(getDashboardPath(user.role));
          return { success: true };
        }
        return {
          success: false,
          error: response.error?.message || '登录失败',
        };
      } catch (error: unknown) {
        let errorMessage = '登录失败，请稍后重试';
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { data?: { error?: { message?: string } } } };
          errorMessage = axiosError.response?.data?.error?.message || errorMessage;
        }
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setLoading(false);
      }
    },
    [login, navigate, setLoading]
  );

  const handleRegister = useCallback(
    async (data: RegisterData) => {
      setLoading(true);
      try {
        const response = await authService.register(data);
        if (response.success && response.data) {
          const { user, accessToken, refreshToken } = response.data;
          login(user, { accessToken, refreshToken });
          navigate(getDashboardPath(user.role));
          return { success: true };
        }
        return {
          success: false,
          error: response.error?.message || '注册失败',
        };
      } catch (error: unknown) {
        let errorMessage = '注册失败，请稍后重试';
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { data?: { error?: { message?: string } } } };
          errorMessage = axiosError.response?.data?.error?.message || errorMessage;
        }
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setLoading(false);
      }
    },
    [login, navigate, setLoading]
  );

  const handleLogout = useCallback(async () => {
    // Clear timers
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    if (activityTimerRef.current) {
      clearInterval(activityTimerRef.current);
      activityTimerRef.current = null;
    }

    try {
      // Call logout API to invalidate token on server
      await authService.logout();
    } catch (error) {
      // Ignore logout API errors - still clear local state
      console.error('Logout API error:', error);
    } finally {
      // Clear local auth state
      storeLogout();
      navigate('/login', { replace: true });
    }
  }, [storeLogout, navigate]);

  return {
    user,
    tokens,
    isAuthenticated,
    isLoading,
    isRefreshing,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    refreshToken,
    updateLastActivity,
  };
}

export default useAuth;
