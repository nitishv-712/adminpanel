'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Building2, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();

  // Once user is hydrated after login, navigate to dashboard
  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      // Navigation is handled by the useEffect above once user state is set
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#061210] relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(rgba(0,229,200,0.03) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(0,229,200,0.03) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[rgba(0,229,200,0.04)] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[rgba(0,229,200,0.03)] rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm mx-4 animate-fade-up">
        {/* Top accent line */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#00E5C8] to-transparent mb-8 opacity-50" />

        <div className=" border border-[rgba(0,229,200,0.15)] rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-[rgba(0,229,200,0.1)] border border-[rgba(0,229,200,0.25)] flex items-center justify-center teal-pulse">
                <Building2 className="w-7 h-7 text-accent" />
              </div>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="font-display text-3xl  tracking-widest mb-1">ADMIN LOGIN</h1>
            <p className=" text-xs uppercase tracking-widest">99HomeBazaar Control Panel</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-[rgba(248,113,113,0.06)] border border-[rgba(248,113,113,0.2)] rounded-xl flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-[#f87171] shrink-0 mt-0.5" />
              <p className="text-sm text-[#f87171]">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold  uppercase tracking-widest">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 " />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@99homebazaar.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0a1a18] border border-[rgba(0,229,200,0.15)] rounded-xl  placeholder: text-sm transition-all focus:outline-none focus:border-[#00E5C8] focus:ring-1 focus:ring-[rgba(0,229,200,0.25)]"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold  uppercase tracking-widest">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 " />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-[#0a1a18] border border-[rgba(0,229,200,0.15)] rounded-xl  placeholder: text-sm transition-all focus:outline-none focus:border-[#00E5C8] focus:ring-1 focus:ring-[rgba(0,229,200,0.25)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2  hover:text-accent transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-[#00E5C8] text-[#061210] font-semibold rounded-xl text-sm transition-all hover:bg-[#00ccb4] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[rgba(0,229,200,0.2)] tracking-wide"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#061210]/30 border-t-[#061210] rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 pt-5 border-t border-[rgba(0,229,200,0.08)] text-center">
            <p className="text-[10px]  uppercase tracking-widest">
              99HomeBazaar Admin Panel v2.0
            </p>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-[#00E5C8] to-transparent mt-8 opacity-50" />
      </div>
    </div>
  );
}
