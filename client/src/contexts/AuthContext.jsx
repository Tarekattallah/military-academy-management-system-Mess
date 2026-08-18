import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import api from '../lib/api';













const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadCurrentUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
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

  const login = useCallback(async (username, password) => {
    const res = await api.post('/auth/login', {
      username,
      password
    });
    setUser(res.data.data.user);
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout');
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const hasPermission = useCallback(
    (permission) => !!user?.permissions.includes(permission),
    [user]
  );

  const hasRole = useCallback(
    (role) => !!user?.roles.includes(role),
    [user]
  );

  const hasAnyRole = useCallback(
    (...roles) => roles.some((role) => user?.roles.includes(role)),
    [user]
  );

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, login, logout, hasPermission, hasRole, hasAnyRole }}>
      
      {children}
    </AuthContext.Provider>);

}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}