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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [gapiReady, setGapiReady] = useState(false);

  useEffect(() => {
    loadGapiClient().then(() => {
      setGapiReady(true);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!gapiReady) return;

    initTokenClient(
      async (response) => {
        gapi.client.setToken({ access_token: response.access_token });
        const userInfo = await fetchUserInfo(response.access_token);
        setUser(userInfo);
        setIsAuthenticated(true);
        setLoading(false);
      },
      (error) => {
        console.error('Auth error:', error);
        setLoading(false);
      },
    );
  }, [gapiReady]);

  const login = useCallback(() => {
    setLoading(true);
    requestAccessToken('consent');
  }, []);

  const logout = useCallback(() => {
    revokeToken();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

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
