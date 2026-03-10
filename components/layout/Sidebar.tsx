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
  Headphones, Star, Sun, Moon,
} from 'lucide-react';
import { Resource, Action } from '@/types';

// ─── Nav config ───────────────────────────────────────────────────────────────
// Each item declares what permission is required to see it.
// Items without resource/action are visible to all logged-in admins (e.g. Dashboard).

interface NavItem {
  href:      string;
  label:     string;
  icon:      React.ElementType;
  resource?: Resource;
  action?:   Action;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',       label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/properties',      label: 'Properties',      icon: Home,           resource: 'properties',    action: 'read' },
  { href: '/users',           label: 'Web Users',       icon: Users,          resource: 'users',         action: 'read' },
  { href: '/inquiries',       label: 'Inquiries',       icon: MessageSquare,  resource: 'inquiries',     action: 'read' },
  { href: '/support-tickets', label: 'Support Tickets', icon: Headphones,     resource: 'supportTickets',action: 'read' },
  { href: '/reviews',         label: 'Reviews',         icon: Star,           resource: 'reviews',       action: 'read' },
  { href: '/newsletter',      label: 'Newsletter',      icon: Mail,           resource: 'newsletter',    action: 'read' },
  { href: '/admin-accounts',  label: 'Admin Accounts',  icon: ShieldCheck,    resource: 'adminUsers',    action: 'read' },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, can, isSuperAdmin } = useAuth();
  const { toggleTheme, isDark } = useTheme();

  // Filter: show item if no permission required, or admin has the required permission
  const visibleItems = NAV_ITEMS.filter(item => {
    if (!item.resource || !item.action) return true;
    return can(item.resource, item.action);
  });

  return (
    <aside style={{
      width: '256px',
      flexShrink: 0,
      height: '100vh',
      position: 'sticky',
      top: 0,
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'background-color 0.3s ease, border-color 0.3s ease',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            backgroundColor: 'var(--accent-dim)',
            border: '1px solid var(--accent-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Building2 style={{ width: '18px', height: '18px', color: 'var(--accent)' }} />
          </div>
          <div>
            <p className="font-display" style={{ fontSize: '17px', color: 'var(--text-primary)', letterSpacing: '0.12em', lineHeight: 1.2 }}>
              99HOMEBAZAAR
            </p>
            <p style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600 }}>
              Admin Panel
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        <p style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, padding: '0 12px 12px' }}>
          Navigation
        </p>

        {visibleItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 500,
                marginBottom: '2px',
                textDecoration: 'none',
                position: 'relative',
                transition: 'all 0.2s ease',
                backgroundColor: isActive ? 'var(--accent-dim)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                ...(isActive ? { boxShadow: 'inset 3px 0 0 var(--accent)' } : {}),
              }}
              className={cn(!isActive && 'nav-link-hover')}
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
                <div style={{
                  position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                  width: '3px', height: '18px',
                  backgroundColor: 'var(--accent)', borderRadius: '0 3px 3px 0',
                }} />
              )}
              <Icon style={{ width: '16px', height: '16px', flexShrink: 0, color: isActive ? 'var(--accent)' : 'var(--text-muted)' }} />
              <span style={{ flex: 1 }}>{label}</span>
              {isActive && <ChevronRight style={{ width: '12px', height: '12px', opacity: 0.5, color: 'var(--accent)' }} />}
            </Link>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      <div style={{ padding: '0 12px 8px' }}>
        <button
          onClick={toggleTheme}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: '10px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg-mid)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 500,
            transition: 'all 0.2s ease',
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
            ? <Sun  style={{ width: '15px', height: '15px', flexShrink: 0 }} />
            : <Moon style={{ width: '15px', height: '15px', flexShrink: 0 }} />
          }
          <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          <div style={{
            marginLeft: 'auto',
            width: '32px', height: '18px',
            borderRadius: '9px',
            backgroundColor: isDark ? 'var(--bg-mid)' : 'var(--accent)',
            border: '1px solid var(--accent-border)',
            position: 'relative',
            transition: 'background-color 0.3s ease',
          }}>
            <div style={{
              position: 'absolute',
              top: '2px',
              left: isDark ? '2px' : '14px',
              width: '12px', height: '12px',
              borderRadius: '50%',
              backgroundColor: isDark ? 'var(--text-muted)' : 'white',
              transition: 'left 0.3s ease, background-color 0.3s ease',
            }} />
          </div>
        </button>
      </div>

      {/* Role + Group badge */}
      <div style={{ padding: '0 12px 8px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 12px',
          backgroundColor: 'var(--accent-dim)',
          border: '1px solid var(--accent-border)',
          borderRadius: '10px',
        }}>
          <ShieldCheck style={{ width: '13px', height: '13px', color: 'var(--accent)', flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <span style={{ fontSize: '10px', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>
              {user?.role?.label ?? user?.role?.name}
            </span>
            {user?.group && (
              <p style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.group.name}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 12px',
          borderRadius: '10px',
          backgroundColor: 'var(--bg-mid)',
          border: '1px solid var(--border)',
        }}>
          <Avatar firstName={user?.firstName} lastName={user?.lastName} avatar={user?.avatar} size="sm" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.firstName} {user?.lastName}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </p>
          </div>
          <button
            onClick={logout}
            title="Logout"
            style={{
              color: 'var(--text-muted)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              transition: 'all 0.2s ease',
              display: 'flex',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = '#ef4444';
              (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(239,68,68,0.08)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
            }}
          >
            <LogOut style={{ width: '14px', height: '14px' }} />
          </button>
        </div>
      </div>
    </aside>
  );
}
