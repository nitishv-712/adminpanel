'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui';
import {
  LayoutDashboard, Users, Home, MessageSquare,
  Mail, LogOut, Building2, ChevronRight, ShieldCheck,
  Headphones, Star, Sun, Moon, X, Notebook, Timer
} from 'lucide-react';
import { Resource, Action } from '@/types';
import { useState, useEffect } from 'react';

interface NavItem {
  href:      string;
  label:     string;
  icon:      React.ElementType;
  resource?: Resource;
  action?:   Action;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',       label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/leads',           label: 'Leads',           icon: Timer,          resource: 'leads',          action: 'read' },
  { href: '/properties',      label: 'Properties',      icon: Home,           resource: 'properties',     action: 'read' },
  { href: '/users',           label: 'Web Users',       icon: Users,          resource: 'users',          action: 'read' },
  { href: '/inquiries',       label: 'Inquiries',       icon: MessageSquare,  resource: 'inquiries',      action: 'read' },
  { href: '/support-tickets', label: 'Support Tickets', icon: Headphones,     resource: 'supportTickets', action: 'read' },
  { href: '/reviews',         label: 'Reviews',         icon: Star,           resource: 'reviews',        action: 'read' },
  { href: '/newsletter',      label: 'Newsletter',      icon: Mail,           resource: 'newsletter',     action: 'read' },
  { href: '/admin-accounts',  label: 'Admin Accounts',  icon: ShieldCheck,    resource: 'adminUsers',     action: 'read' },
  { href: '/auditLogs',       label: 'Audit Logs',      icon: Notebook,       resource: 'auditLogs',      action: 'read' },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose = () => {} }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout, can } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close on route change
  useEffect(() => { onClose?.(); }, [pathname]);

  // Lock body scroll when open on mobile
  useEffect(() => {
    if (isMobile) document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, isMobile]);

  const visibleItems = NAV_ITEMS.filter(item => {
    if (!item.resource || !item.action) return true;
    return can(item.resource, item.action);
  });

  return (
    <>
      {/* Backdrop */}
      {isMobile && isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-[49] bg-black/45 backdrop-blur-sm animate-fade-in"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'w-64 shrink-0 h-screen flex flex-col border-r transition-all duration-300 ease-in-out',
          isMobile
            ? cn('fixed top-0 left-0 z-50', isOpen ? 'translate-x-0' : '-translate-x-full')
            : 'sticky top-0'
        )}
        style={{
          backgroundColor: 'var(--bg-sidebar)',
          borderColor: 'var(--border)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{ backgroundColor: 'var(--accent-dim)', borderColor: 'var(--accent-border)' }}
            >
              <Building2 className="w-[18px] h-[18px]" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <p
                className="font-display text-[17px] leading-tight tracking-[0.12em]"
                style={{ color: 'var(--text-primary)' }}
              >
                99HOMEBAZAAR
              </p>
              <p
                className="text-[9px] uppercase tracking-[0.15em] font-semibold"
                style={{ color: 'var(--text-muted)' }}
              >
                Admin Panel
              </p>
            </div>
          </div>

          {/* Close — mobile only */}
          {isMobile && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--accent-dim)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
                (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p
            className="text-[9px] uppercase tracking-[0.15em] font-bold px-3 pb-3"
            style={{ color: 'var(--text-muted)' }}
          >
            Navigation
          </p>

          {visibleItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium mb-0.5 transition-all duration-200 no-underline',
                )}
                style={{
                  backgroundColor: isActive ? 'var(--accent-dim)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  boxShadow: isActive ? 'inset 3px 0 0 var(--accent)' : 'none',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--accent-dim)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                  }
                }}
              >
                {isActive && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-r-sm"
                    style={{ backgroundColor: 'var(--accent)' }}
                  />
                )}
                <Icon
                  className="w-4 h-4 shrink-0"
                  style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}
                />
                <span className="flex-1">{label}</span>
                {isActive && (
                  <ChevronRight className="w-3 h-3 opacity-50" style={{ color: 'var(--accent)' }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Theme Toggle */}
        <div className="px-3 pb-2">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all duration-200"
            style={{
              backgroundColor: 'var(--bg-mid)',
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-border)';
              (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
            }}
          >
            {isDark
              ? <Sun className="w-[15px] h-[15px] shrink-0" />
              : <Moon className="w-[15px] h-[15px] shrink-0" />
            }
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            <div
              className="relative ml-auto w-8 h-[18px] rounded-full border transition-colors duration-300"
              style={{
                backgroundColor: isDark ? 'var(--bg-mid)' : 'var(--accent)',
                borderColor: 'var(--accent-border)',
              }}
            >
              <div
                className="absolute top-[2px] w-3 h-3 rounded-full transition-all duration-300"
                style={{
                  left: isDark ? '2px' : '14px',
                  backgroundColor: isDark ? 'var(--text-muted)' : 'white',
                }}
              />
            </div>
          </button>
        </div>

        {/* Role + Group badge */}
        <div className="px-3 pb-2">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl border"
            style={{ backgroundColor: 'var(--accent-dim)', borderColor: 'var(--accent-border)' }}
          >
            <ShieldCheck className="w-3 h-3 shrink-0" style={{ color: 'var(--accent)' }} />
            <div className="min-w-0">
              <span
                className="text-[10px] uppercase tracking-[0.12em] font-bold"
                style={{ color: 'var(--accent)' }}
              >
                {user?.role?.label ?? user?.role?.name}
              </span>
              {user?.group && (
                <p className="text-[9px] mt-px truncate" style={{ color: 'var(--text-muted)' }}>
                  {user.group.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <div
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border"
            style={{ backgroundColor: 'var(--bg-mid)', borderColor: 'var(--border)' }}
          >
            <Avatar firstName={user?.firstName} lastName={user?.lastName} avatar={user?.avatar} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                {user?.email}
              </p>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 rounded-lg flex items-center justify-center transition-all duration-200"
              style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = '#ef4444';
                (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(239,68,68,0.08)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
                (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              }}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}