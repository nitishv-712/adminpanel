'use client';
import { useState } from 'react';
import AuthGuard from '@/components/layout/AuthGuard';
import Sidebar from '@/components/layout/Sidebar';
import { Menu } from 'lucide-react';
import { PermissionGuard } from '@/components/layout/AuthGuard';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-page-c">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto bg-page-c">
          <div className="max-w-7xl mx-auto p-6 lg:p-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex md:hidden items-center justify-center w-10 h-10 rounded-xl border mb-4"
              style={{
                backgroundColor: 'var(--bg-sidebar)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
              }}
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <PermissionGuard resource="newsletter" action="read">
              {children}
            </PermissionGuard>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
