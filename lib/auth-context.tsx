'use client';
import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { adminAuthApi } from './api';
import { AdminUser, Resource, Action } from '@/types';

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  can: (resource: Resource, action: Action) => boolean;
  canAny: (resource: Resource, actions: Action[]) => boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const extractAdmin = (res: any): AdminUser | null =>
  res?.data?.data?.admin    ??   // standard shape
  res?.data?.message?.admin ??   // swapped shape (your current backend)
  res?.data?.admin          ??   // flat shape
  null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const didFetch              = useRef(false);

  // Restore session on mount
  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    adminAuthApi.me()
      .then(res => setUser(extractAdmin(res)))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await adminAuthApi.login(email, password);
      const admin = extractAdmin(res);
      if (!admin) throw new Error('Login response missing admin data');
      setUser(admin);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try { await adminAuthApi.logout(); } catch {}
    setUser(null);
    if (typeof window !== 'undefined') window.location.href = '/login';
  };

  const can = useCallback(
    (resource: Resource, action: Action): boolean => {
      if (!user?.permissions) return false;
      return user.permissions[resource]?.[action] === true;
    },
    [user]
  );

  const canAny = useCallback(
    (resource: Resource, actions: Action[]): boolean => {
      if (!user?.permissions) return false;
      return actions.some(a => user.permissions[resource]?.[a] === true);
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      can,
      canAny,
      isSuperAdmin: user?.role?.name === 'superadmin',
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