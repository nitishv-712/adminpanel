'use client';
import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { adminAuthApi } from './api';
import { AdminUser } from '@/types';

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const didFetch              = useRef(false);

  // On mount: check if a session cookie already exists
  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;

    adminAuthApi.me()
      .then(res => setUser(res.data.data.admin))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await adminAuthApi.login(email, password);
      const meRes = await adminAuthApi.me();
      setUser(meRes.data.data.admin);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try { await adminAuthApi.logout(); } catch {}
    setUser(null);
    if (typeof window !== 'undefined') window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isSuperAdmin: user?.role === 'superadmin',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
