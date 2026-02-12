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

const STORAGE_KEY_TOKEN = 'habit_loops_access_token';
const STORAGE_KEY_USER = 'habit_loops_user';
const STORAGE_KEY_EXPIRY = 'habit_loops_token_expiry';

// In-memory fallback storage when localStorage is unavailable
const memoryStorage: Record<string, string> = {};

// Safe localStorage wrapper functions
function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn('localStorage.setItem failed, using in-memory storage:', error);
    memoryStorage[key] = value;
  }
}

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn('localStorage.getItem failed, using in-memory storage:', error);
    return memoryStorage[key] ?? null;
  }
}

function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('localStorage.removeItem failed, using in-memory storage:', error);
    delete memoryStorage[key];
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [gapiReady, setGapiReady] = useState(false);

  // Helper to save auth data to localStorage
  const saveAuthData = useCallback((accessToken: string, userInfo: GoogleUser, expiresIn: number) => {
    safeSetItem(STORAGE_KEY_TOKEN, accessToken);
    safeSetItem(STORAGE_KEY_USER, JSON.stringify(userInfo));
    // Store expiry time (current time + expires_in seconds)
    const expiryTime = Date.now() + (expiresIn * 1000);
    safeSetItem(STORAGE_KEY_EXPIRY, expiryTime.toString());
  }, []);

  // Helper to clear auth data from localStorage
  const clearAuthData = useCallback(() => {
    safeRemoveItem(STORAGE_KEY_TOKEN);
    safeRemoveItem(STORAGE_KEY_USER);
    safeRemoveItem(STORAGE_KEY_EXPIRY);
  }, []);

  // Helper to check if token is expired
  const isTokenExpired = useCallback(() => {
    const expiryTime = safeGetItem(STORAGE_KEY_EXPIRY);
    if (!expiryTime) return true;
    return Date.now() >= parseInt(expiryTime);
  }, []);

  // Restore session from localStorage
  useEffect(() => {
    loadGapiClient().then(() => {
      const storedToken = safeGetItem(STORAGE_KEY_TOKEN);
      const storedUser = safeGetItem(STORAGE_KEY_USER);

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
        // Token exists but is expired, clear it
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
        
        // Save to localStorage with expiry (default to 1 hour if not provided)
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
