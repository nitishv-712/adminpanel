'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Eye, EyeOff, Building2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace('/dashboard');
    } catch (err: unknown) {
      console.error('Login error:', err);
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })
        ?.response?.data?.message || (err as { message?: string })?.message || 'Login failed';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-gold-400 blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-gold-600 blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold-500 mb-5">
            <Building2 className="w-8 h-8 text-ink-950" />
          </div>
          <h1 className="font-display text-3xl text-white font-semibold tracking-tight">
            99HomeBazaar
          </h1>
          <p className="text-ink-400 mt-2 text-sm">Admin Control Panel</p>
        </div>

        {/* Card */}
        <div className="bg-ink-900 rounded-3xl border border-ink-800 p-8 shadow-2xl">
          <h2 className="text-white font-display text-xl font-medium mb-6">Sign in</h2>

          {error && (
            <div className="flex items-center gap-2.5 bg-red-900/30 border border-red-700/50 text-red-300 rounded-xl px-4 py-3 mb-5 text-sm animate-slide-up">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-ink-400 text-xs uppercase tracking-widest font-500 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                className="w-full bg-ink-800 border border-ink-700 text-white placeholder-ink-600 rounded-xl px-4 py-3 text-sm focus:border-gold-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-ink-400 text-xs uppercase tracking-widest font-500 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-ink-800 border border-ink-700 text-white placeholder-ink-600 rounded-xl px-4 py-3 pr-11 text-sm focus:border-gold-500 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-300 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed text-ink-950 font-600 rounded-xl py-3 text-sm transition-colors mt-2"
            >
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-ink-600 text-xs mt-6">
          Only admin accounts can access this panel.
        </p>
      </div>
    </div>
  );
}
