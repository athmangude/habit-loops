import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { loadGapiClient, initTokenClient, requestAccessToken, revokeToken, fetchUserInfo } from '../services/authService';
import type { GoogleUser } from '../types/google';

interface AuthState {
  isAuthenticated: boolean;
  user: GoogleUser | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

// Using sessionStorage instead of localStorage for better security against XSS
// Tokens are cleared when the browser tab/window is closed
const STORAGE_KEY_TOKEN = 'habit_loops_access_token';
const STORAGE_KEY_USER = 'habit_loops_user';
const STORAGE_KEY_EXPIRY = 'habit_loops_token_expiry';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [gapiReady, setGapiReady] = useState(false);

  // Helper to save auth data to sessionStorage (more secure than localStorage)
  const saveAuthData = useCallback((accessToken: string, userInfo: GoogleUser, expiresIn: number) => {
    sessionStorage.setItem(STORAGE_KEY_TOKEN, accessToken);
    sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userInfo));
    // Store expiry time (current time + expires_in seconds)
    const expiryTime = Date.now() + (expiresIn * 1000);
    sessionStorage.setItem(STORAGE_KEY_EXPIRY, expiryTime.toString());
  }, []);

  // Helper to clear auth data from sessionStorage
  const clearAuthData = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY_TOKEN);
    sessionStorage.removeItem(STORAGE_KEY_USER);
    sessionStorage.removeItem(STORAGE_KEY_EXPIRY);
  }, []);

  // Helper to check if token is expired
  const isTokenExpired = useCallback(() => {
    const expiryTime = sessionStorage.getItem(STORAGE_KEY_EXPIRY);
    if (!expiryTime) return true;
    // Ensure the stored expiry is a strictly numeric integer string
    if (!/^\d+$/.test(expiryTime)) {
      // Invalid expiry value, clear stored auth data and treat as expired
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_EXPIRY);
      return true;
    }
    const parsedExpiry = Number(expiryTime);
    if (!Number.isFinite(parsedExpiry) || !Number.isSafeInteger(parsedExpiry)) {
      // Invalid expiry value, clear stored auth data and treat as expired
      clearAuthData();
      return true;
    }
    return Date.now() >= parsedExpiry;
  }, [clearAuthData]);

  // Restore session from sessionStorage
  useEffect(() => {
    loadGapiClient().then(() => {
      // One-time migration: clear old localStorage data if it exists
      // Using a flag to ensure this only runs once per user
      const migrationKey = 'habit_loops_migration_completed';
      if (!localStorage.getItem(migrationKey)) {
        localStorage.removeItem(STORAGE_KEY_TOKEN);
        localStorage.removeItem(STORAGE_KEY_USER);
        localStorage.removeItem(STORAGE_KEY_EXPIRY);
        localStorage.setItem(migrationKey, 'true');
      }

      const storedToken = sessionStorage.getItem(STORAGE_KEY_TOKEN);
      const storedUser = sessionStorage.getItem(STORAGE_KEY_USER);

      if (storedToken && storedUser && !isTokenExpired()) {
        try {
          // Restore the session
          const parsedUser = JSON.parse(storedUser);
          // Validate that the parsed user has required fields
          if (parsedUser && typeof parsedUser === 'object' && parsedUser.email && parsedUser.name) {
            gapi.client.setToken({ access_token: storedToken });
            setUser(parsedUser);
            setIsAuthenticated(true);
          } else {
            // Invalid user data, clear storage
            clearAuthData();
          }
        } catch (error) {
          console.error('Failed to restore session:', error);
          clearAuthData();
        }
      } else if (storedToken) {
        // Token exists but auth state is incomplete or invalid (expired token, missing/corrupt user data, or missing expiry)
        clearAuthData();
      }

      setGapiReady(true);
      setLoading(false);
    });
  }, [isTokenExpired, clearAuthData]);

  useEffect(() => {
    if (!gapiReady) return;

    initTokenClient(
      async (response) => {
        gapi.client.setToken({ access_token: response.access_token });
        const userInfo = await fetchUserInfo(response.access_token);
        
        // Save to sessionStorage with expiry (default to 1 hour if not provided)
        const expiresIn = response.expires_in || 3600;
        saveAuthData(response.access_token, userInfo, expiresIn);
        
        setUser(userInfo);
        setIsAuthenticated(true);
        setLoading(false);
      },
      (error) => {
        console.error('Auth error:', error);
        setLoading(false);
      },
    );
  }, [gapiReady, saveAuthData]);

  const login = useCallback(() => {
    setLoading(true);
    requestAccessToken('consent');
  }, []);

  const logout = useCallback(() => {
    revokeToken();
    clearAuthData();
    setUser(null);
    setIsAuthenticated(false);
  }, [clearAuthData]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
