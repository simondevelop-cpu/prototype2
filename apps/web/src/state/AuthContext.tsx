import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { api } from '../lib/api';

type User = {
  id: string;
  email: string;
  name?: string | null;
  locale: string;
  currency: string;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password?: string) => Promise<void>;
  register: (input: { email: string; password?: string; name?: string }) => Promise<void>;
  useDemo: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'canadian-insights-token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { user: current } = await api.get<{ user: User }>('/auth/me', { token });
        setUser(current);
      } catch (error) {
        console.warn('Auth bootstrap failed', error);
        setToken(null);
        localStorage.removeItem(TOKEN_KEY);
      } finally {
        setLoading(false);
      }
    };
    void bootstrap();
  }, [token]);

  const persistSession = useCallback((nextToken: string, nextUser: User) => {
    setToken(nextToken);
    localStorage.setItem(TOKEN_KEY, nextToken);
    setUser(nextUser);
  }, []);

  const signIn = useCallback(
    async (email: string, password?: string) => {
      const { token: nextToken, user: nextUser } = await api.post<{ token: string; user: User }>('/auth/login', {
        email,
        password,
      });
      persistSession(nextToken, nextUser);
    },
    [persistSession],
  );

  const register = useCallback(
    async ({ email, password, name }: { email: string; password?: string; name?: string }) => {
      const { token: nextToken, user: nextUser } = await api.post<{ token: string; user: User }>('/auth/register', {
        email,
        password,
        name,
      });
      persistSession(nextToken, nextUser);
    },
    [persistSession],
  );

  const useDemo = useCallback(async () => {
    const { token: nextToken, user: nextUser } = await api.post<{ token: string; user: User }>('/auth/demo');
    persistSession(nextToken, nextUser);
  }, [persistSession]);

  const signOut = useCallback(async () => {
    if (token) {
      await api.post('/auth/logout', undefined, { token });
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
  }, [token]);

  const value = useMemo(
    () => ({ user, token, loading, signIn, register, useDemo, signOut }),
    [user, token, loading, signIn, register, useDemo, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
