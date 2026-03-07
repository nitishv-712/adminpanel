'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { LoadingPage } from '@/components/ui';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  // Prevent redirect from firing more than once per mount.
  const redirected = useRef(false);

  useEffect(() => {
    if (loading) return;               // still checking session — wait
    if (user) return;                  // logged in — nothing to do
    if (redirected.current) return;    // already redirecting — don't fire again
    redirected.current = true;
    router.replace('/login');
  }, [user, loading]);                 // intentionally omit router — it's stable enough
                                       // but including it can cause extra effect runs

  if (loading) return <LoadingPage />;
  if (!user) return null;              // blank screen while replace('/login') animates

  return <>{children}</>;
}
