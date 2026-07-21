import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import api from '../lib/api';
import type { AuthUser, ApiResponse } from '../types/auth';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadCurrentUser = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<{ user: AuthUser }>>('/auth/me');
      setUser(res.data.data.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.post<ApiResponse<{ user: AuthUser }>>('/auth/login', {
      username,
      password,
    });
    setUser(res.data.data.user);
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout');
    setUser(null);
  }, []);

  const hasPermission = useCallback(
    (permission: string) => !!user?.permissions.includes(permission),
    [user]
  );

  const hasRole = useCallback(
    (role: string) => !!user?.roles.includes(role),
    [user]
  );

  const hasAnyRole = useCallback(
    (...roles: string[]) => roles.some((role) => user?.roles.includes(role)),
    [user]
  );

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, login, logout, hasPermission, hasRole, hasAnyRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
