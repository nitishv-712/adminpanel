'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard, Users, Home, MessageSquare,
  Mail, LogOut, Building2, ChevronRight
} from 'lucide-react';
import clsx from 'clsx';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/properties', label: 'Properties', icon: Home },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/inquiries', label: 'Inquiries', icon: MessageSquare },
  { href: '/newsletter', label: 'Newsletter', icon: Mail },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 bg-ink-950 flex flex-col border-r border-ink-800">
      {/* Logo */}
      <div className="px-6 py-7 border-b border-ink-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gold-500 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-ink-950" />
          </div>
          <div>
            <p className="font-display text-white font-semibold text-sm leading-tight">99HomeBazaar</p>
            <p className="text-ink-500 text-xs">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        <p className="text-ink-600 text-xs uppercase tracking-widest font-500 px-3 pb-2">Menu</p>
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group',
                active
                  ? 'bg-gold-500/15 text-gold-400 font-500'
                  : 'text-ink-400 hover:bg-ink-800 hover:text-ink-100'
              )}
            >
              <Icon className={clsx('w-4.5 h-4.5', active ? 'text-gold-400' : 'text-ink-500 group-hover:text-ink-300')} style={{ width: 18, height: 18 }} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 text-gold-500" />}
            </Link>
          );
        })}
      </nav>

      {/* User / Logout */}
      <div className="px-3 py-4 border-t border-ink-800">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-ink-900">
          <div className="w-8 h-8 rounded-full bg-gold-700 flex items-center justify-center text-gold-200 text-xs font-600 shrink-0">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-500 truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-ink-500 text-xs truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="text-ink-500 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
