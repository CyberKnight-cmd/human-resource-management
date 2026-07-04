import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { getTokens } from '../api/client';
import { login as apiLogin, logout as apiLogout } from '../api/auth';

function decodeJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function deriveUser(tokens) {
  if (!tokens?.access_token) return null;
  const payload = decodeJwt(tokens.access_token);
  if (!payload) return null;
  return { id: payload.sub, role: payload.role };
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => deriveUser(getTokens()));

  const login = useCallback(async (email, password) => {
    const tokens = await apiLogin(email, password);
    const nextUser = deriveUser(tokens);
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, isAuthenticated: !!user, login, logout }), [user, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
