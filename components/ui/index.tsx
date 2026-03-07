'use client';
import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import { X, AlertTriangle } from 'lucide-react';

// ─── Card ─────────────────────────────────────────────────────
export function Card({
  children, className, hover = false, glow = false,
}: {
  children: ReactNode; className?: string; hover?: boolean; glow?: boolean;
}) {
  return (
    <div
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', boxShadow: 'var(--shadow-card)', transition: 'background-color 0.3s ease, border-color 0.3s ease' }}
      className={cn(hover && 'card-hover cursor-pointer', glow && 'card-glow', className)}
    >
      {children}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────
export function StatCard({
  label, value, sub, icon, trend, accent = false,
}: {
  label: string; value: string | number; sub?: string; icon?: ReactNode;
  trend?: { value: number; label: string }; accent?: boolean;
}) {
  return (
    <Card hover className="p-5 relative overflow-hidden">
      {accent && (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, var(--accent-dim) 0%, transparent 60%)', pointerEvents: 'none' }} />
      )}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>{label}</p>
          <p className="font-display" style={{ fontSize: '28px', color: 'var(--text-primary)', letterSpacing: '0.05em' }}>{value}</p>
          {sub && <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{sub}</p>}
        </div>
        {icon && (
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px',
            backgroundColor: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent)',
          }}>
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className={cn('flex items-center gap-1 text-xs font-medium mt-2')}
          style={{ color: trend.value >= 0 ? 'var(--accent)' : '#ef4444' }}>
          <span>{trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
          <span style={{ color: 'var(--text-muted)' }}>{trend.label}</span>
        </div>
      )}
    </Card>
  );
}

// ─── Badge ────────────────────────────────────────────────────
export function Badge({
  children, variant = 'default',
}: {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'teal';
}) {
  const variantStyles: Record<string, React.CSSProperties> = {
    default: { backgroundColor: 'var(--bg-mid)', color: 'var(--text-secondary)', border: '1px solid var(--border)' },
    success: { backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' },
    warning: { backgroundColor: 'rgba(245,158,11,0.1)', color: '#d97706', border: '1px solid rgba(245,158,11,0.25)' },
    danger:  { backgroundColor: 'rgba(239,68,68,0.1)',  color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' },
    info:    { backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.25)' },
    teal:    { backgroundColor: 'var(--accent-dim)',    color: 'var(--accent)', border: '1px solid var(--accent-border)' },
  };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, ...variantStyles[variant] }}>
      {children}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────
export function StatusBadge({ value }: { value: string }) {
  const statusMap: Record<string, { variant: 'success'|'warning'|'danger'|'info'|'default'|'teal'; label: string }> = {
    active:        { variant: 'success', label: 'Active' },
    pending:       { variant: 'warning', label: 'Pending' },
    sold:          { variant: 'info',    label: 'Sold' },
    rented:        { variant: 'info',    label: 'Rented' },
    archived:      { variant: 'default', label: 'Archived' },
    sale:          { variant: 'success', label: 'For Sale' },
    rent:          { variant: 'teal',    label: 'For Rent' },
    buyer:         { variant: 'info',    label: 'Buyer' },
    seller:        { variant: 'success', label: 'Seller' },
    agent:         { variant: 'teal',    label: 'Agent' },
    admin:         { variant: 'warning', label: 'Admin' },
    superadmin:    { variant: 'danger',  label: 'Super Admin' },
    closed:        { variant: 'default', label: 'Closed' },
    open:          { variant: 'warning', label: 'Open' },
    'in-progress': { variant: 'info',    label: 'In Progress' },
    resolved:      { variant: 'success', label: 'Resolved' },
    low:           { variant: 'default', label: 'Low' },
    medium:        { variant: 'warning', label: 'Medium' },
    high:          { variant: 'danger',  label: 'High' },
    published:     { variant: 'success', label: 'Published' },
    hidden:        { variant: 'default', label: 'Hidden' },
    rejected:      { variant: 'danger',  label: 'Rejected' },
    technical:     { variant: 'info',    label: 'Technical' },
    billing:       { variant: 'warning', label: 'Billing' },
    account:       { variant: 'default', label: 'Account' },
    listing:       { variant: 'teal',    label: 'Listing' },
    other:         { variant: 'default', label: 'Other' },
    true:          { variant: 'success', label: 'Verified' },
    false:         { variant: 'default', label: 'Unverified' },
  };
  const s = statusMap[String(value).toLowerCase()] || { variant: 'default' as const, label: value };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

// ─── Button ───────────────────────────────────────────────────
export function Button({
  children, variant = 'primary', size = 'md', className, ...props
}: {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const variantStyles: Record<string, React.CSSProperties> = {
    primary:   { backgroundColor: 'var(--accent)', color: 'var(--text-on-accent)', fontWeight: 600 },
    secondary: { backgroundColor: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent-border)' },
    outline:   { border: '1px solid var(--border-strong)', color: 'var(--text-secondary)', backgroundColor: 'transparent' },
    ghost:     { color: 'var(--text-secondary)', backgroundColor: 'transparent' },
    danger:    { backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' },
  };
  const sizeClasses = { sm: 'px-3 py-1.5 text-xs rounded-lg', md: 'px-4 py-2 text-sm rounded-xl', lg: 'px-6 py-3 text-base rounded-xl' };
  return (
    <button
      style={variantStyles[variant]}
      className={cn('inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed', sizeClasses[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}

// ─── Input ────────────────────────────────────────────────────
export function Input({
  label, error, className, ...props
}: {
  label?: string; error?: string; className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      {label && <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>}
      <input
        style={{
          width: '100%', padding: '10px 14px', borderRadius: '10px',
          backgroundColor: 'var(--input-bg)', border: `1px solid ${error ? 'rgba(239,68,68,0.4)' : 'var(--border-strong)'}`,
          color: 'var(--text-primary)', fontSize: '13px',
          outline: 'none', transition: 'all 0.2s ease',
        }}
        className={cn(className)}
        {...props}
      />
      {error && <p style={{ fontSize: '11px', color: '#ef4444' }}>{error}</p>}
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────
export function Textarea({
  label, error, className, ...props
}: {
  label?: string; error?: string; className?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="space-y-1.5">
      {label && <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>}
      <textarea
        style={{
          width: '100%', padding: '10px 14px', borderRadius: '10px',
          backgroundColor: 'var(--input-bg)', border: `1px solid ${error ? 'rgba(239,68,68,0.4)' : 'var(--border-strong)'}`,
          color: 'var(--text-primary)', fontSize: '13px', resize: 'none',
          outline: 'none', transition: 'all 0.2s ease',
        }}
        className={cn(className)}
        {...props}
      />
      {error && <p style={{ fontSize: '11px', color: '#ef4444' }}>{error}</p>}
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────
export function Select({
  label, error, children, className, ...props
}: {
  label?: string; error?: string; children: ReactNode; className?: string;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="space-y-1.5">
      {label && <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>}
      <select
        style={{
          width: '100%', padding: '10px 14px', borderRadius: '10px',
          backgroundColor: 'var(--input-bg)', border: `1px solid ${error ? 'rgba(239,68,68,0.4)' : 'var(--border-strong)'}`,
          color: 'var(--text-primary)', fontSize: '13px',
          outline: 'none', transition: 'all 0.2s ease',
        }}
        className={cn(className)}
        {...props}
      >
        {children}
      </select>
      {error && <p style={{ fontSize: '11px', color: '#ef4444' }}>{error}</p>}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────
export function Modal({
  isOpen, onClose, title, children, size = 'md',
}: {
  isOpen: boolean; onClose: () => void; title: string; children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  if (!isOpen) return null;
  const maxWidths = { sm: '400px', md: '500px', lg: '720px' };
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'var(--overlay)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{
        position: 'relative', backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-strong)', borderRadius: '16px',
        boxShadow: 'var(--shadow-modal)', width: '100%', maxWidth: maxWidths[size],
      }} className="animate-fade-up">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          <h3 className="font-display" style={{ fontSize: '20px', color: 'var(--text-primary)', letterSpacing: '0.05em' }}>{title}</h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '8px', transition: 'all 0.2s ease', display: 'flex' }}>
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────
export function ConfirmModal({
  isOpen, onClose, onConfirm, title, message, loading,
}: {
  isOpen: boolean; onClose: () => void; onConfirm: () => void;
  title: string; message: string; loading?: boolean;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-5">
        <div style={{ display: 'flex', gap: '12px', padding: '14px', backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '10px' }}>
          <AlertTriangle style={{ width: '18px', height: '18px', color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{message}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="danger" className="flex-1" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Spinner ──────────────────────────────────────────────────
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: '16px', md: '24px', lg: '32px' };
  return (
    <div style={{
      width: sizes[size], height: sizes[size], borderRadius: '50%',
      border: '2px solid var(--accent-dim)', borderTopColor: 'var(--accent)',
      animation: 'spin 0.75s linear infinite',
    }} className="animate-spin" />
  );
}

// ─── Loading Page ─────────────────────────────────────────────
export function LoadingPage() {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      <div style={{ textAlign: 'center' }}>
        <Spinner size="lg" />
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '16px' }}>Loading...</p>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────
export function EmptyState({
  icon, title, description, action,
}: {
  icon: ReactNode; title: string; description: string; action?: ReactNode;
}) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 16px' }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '64px', height: '64px', borderRadius: '16px',
        backgroundColor: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
        color: 'var(--text-muted)', marginBottom: '16px',
      }}>
        {icon}
      </div>
      <h3 className="font-display" style={{ fontSize: '22px', color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '0.05em' }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '360px', margin: '0 auto 24px', fontSize: '13px' }}>{description}</p>
      {action}
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────
export function Pagination({
  page, totalPages, total, limit, onPage,
}: {
  page: number; totalPages: number; total: number; limit: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
        Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Button variant="ghost" size="sm" onClick={() => onPage(page - 1)} disabled={page === 1}>←</Button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let p = i + 1;
          if (totalPages > 5) {
            if (page <= 3) p = i + 1;
            else if (page >= totalPages - 2) p = totalPages - 4 + i;
            else p = page - 2 + i;
          }
          return (
            <button
              key={p}
              onClick={() => onPage(p)}
              style={{
                width: '30px', height: '30px', borderRadius: '8px', fontSize: '12px', fontWeight: 500,
                border: 'none', cursor: 'pointer', transition: 'all 0.15s ease',
                backgroundColor: p === page ? 'var(--accent)' : 'transparent',
                color: p === page ? 'var(--text-on-accent)' : 'var(--text-secondary)',
              }}
            >
              {p}
            </button>
          );
        })}
        <Button variant="ghost" size="sm" onClick={() => onPage(page + 1)} disabled={page === totalPages}>→</Button>
      </div>
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────
export function Avatar({
  firstName, lastName, avatar, size = 'md',
}: {
  firstName?: string | null; lastName?: string | null; avatar?: string | null; size?: 'sm' | 'md' | 'lg';
}) {
  const dim = { sm: '32px', md: '40px', lg: '48px' };
  const fs  = { sm: '11px', md: '13px', lg: '15px' };
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || '??';

  if (avatar) return (
    <img src={avatar} alt={initials} style={{ width: dim[size], height: dim[size], borderRadius: '50%', objectFit: 'cover' }} />
  );

  return (
    <div style={{
      width: dim[size], height: dim[size], borderRadius: '50%',
      backgroundColor: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--accent)', fontWeight: 600, fontSize: fs[size], flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>{children}</table>
    </div>
  );
}
export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid var(--border)' }} className={className}>
      {children}
    </th>
  );
}
export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }} className={className}>
      {children}
    </td>
  );
}
export function Tr({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <tr className={cn('table-row-hover', className)}>{children}</tr>
  );
}