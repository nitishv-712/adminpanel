import AuthGuard from '@/components/layout/AuthGuard';
import { PermissionGuard } from '@/components/layout/AuthGuard';
import Sidebar from '@/components/layout/Sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-page-c">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-page-c">
          <div className="max-w-7xl mx-auto p-6 lg:p-8">
            <PermissionGuard resource="inquiries" action="read">
              {children}
            </PermissionGuard>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
