import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/lib/theme-context';
import { DataCacheProvider } from '@/lib/data-cache-context';

export const metadata: Metadata = {
  title: '99HomeBazaar – Admin Panel',
  description: 'Admin dashboard for 99HomeBazaar real estate platform.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <DataCacheProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </DataCacheProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
