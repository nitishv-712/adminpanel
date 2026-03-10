'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { LoadingPage } from '@/components/ui';
import { Resource, Action } from '@/types';

// ─── AuthGuard ────────────────────────────────────────────────────────────────
// Redirects to /login if no session. Used in every layout.tsx.

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const redirected = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (user) return;
    if (redirected.current) return;
    redirected.current = true;
    router.replace('/login');
  }, [user, loading]);

  if (loading) return <LoadingPage />;
  if (!user)   return null;

  return <>{children}</>;
}

// ─── PermissionGuard ──────────────────────────────────────────────────────────
// Renders children only if the admin has the required permission.
// Renders `fallback` (default: Unauthorized page) otherwise.
//
// Usage:
//   <PermissionGuard resource="properties" action="approve">
//     <ApproveButton />
//   </PermissionGuard>
//
//   // Multiple actions — passes if admin has ANY
//   <PermissionGuard resource="reviews" actions={['approve', 'reject']} anyOf>
//     <ModerationPanel />
//   </PermissionGuard>
//
//   // Custom fallback instead of redirect
//   <PermissionGuard resource="users" action="delete" fallback={<p>No access</p>}>
//     <DeleteButton />
//   </PermissionGuard>

interface PermissionGuardProps {
  resource: Resource;
  action?: Action;
  actions?: Action[];
  anyOf?: boolean;          // if true, passes if admin has ANY of actions[]
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  resource,
  action,
  actions,
  anyOf = false,
  children,
  fallback = <UnauthorizedPage />,
}: PermissionGuardProps) {
  const { can, canAny } = useAuth();

  let granted = false;

  if (actions && actions.length > 0) {
    granted = anyOf ? canAny(resource, actions) : actions.every(a => can(resource, a));
  } else if (action) {
    granted = can(resource, action);
  }

  return granted ? <>{children}</> : <>{fallback}</>;
}

// ─── UnauthorizedPage ─────────────────────────────────────────────────────────
// Shown when a user navigates to a page they don't have permission for.
// Keeps the sidebar visible so they can navigate away.

export function UnauthorizedPage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: '16px',
      textAlign: 'center',
    }}>
      <div style={{
        width: '64px', height: '64px',
        borderRadius: '16px',
        backgroundColor: 'var(--accent-dim)',
        border: '1px solid var(--accent-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '28px',
      }}>
        🔒
      </div>
      <div>
        <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Access Restricted
        </p>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '320px' }}>
          You don't have permission to view this page. Contact your superadmin if you think this is a mistake.
        </p>
      </div>
    </div>
  );
}
