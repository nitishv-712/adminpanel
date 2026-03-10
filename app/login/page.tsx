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

  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: 'var(--bg-page)' }}>
      {/* Background grid */}
      <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(var(--accent-dim) 1px, transparent 1px),
                          linear-gradient(90deg, var(--accent-dim) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'var(--accent-dim)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'var(--accent-dim)' }} />

      <div className="relative w-full max-w-sm mx-4 animate-fade-up">
        <div className="h-px mb-8 opacity-50" style={{ background: 'linear-gradient(to right, transparent, var(--accent), transparent)' }} />

        <div className="border rounded-2xl p-8 shadow-2xl" style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--accent-border)',
        }}>
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{
              backgroundColor: 'var(--accent-dim)',
              border: '1px solid var(--accent-border)',
            }}>
              <Building2 className="w-7 h-7" style={{ color: 'var(--accent)' }} />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="font-display text-3xl tracking-widest mb-1" style={{ color: 'var(--text-primary)' }}>ADMIN LOGIN</h1>
            <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>99HomeBazaar Control Panel</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl flex items-start gap-3" style={{
              backgroundColor: 'rgba(248,113,113,0.06)',
              border: '1px solid rgba(248,113,113,0.2)',
            }}>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#f87171' }} />
              <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@99homebazaar.com"
                  required
                  style={{
                    width: '100%',
                    paddingLeft: '40px', paddingRight: '16px', paddingTop: '10px', paddingBottom: '10px',
                    backgroundColor: 'var(--input-bg)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: '12px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-strong)'}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    paddingLeft: '40px', paddingRight: '40px', paddingTop: '10px', paddingBottom: '10px',
                    backgroundColor: 'var(--input-bg)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: '12px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-strong)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                marginTop: '8px',
                padding: '12px',
                backgroundColor: 'var(--accent)',
                color: 'var(--bg-page)',
                fontWeight: 600,
                borderRadius: '12px',
                fontSize: '14px',
                letterSpacing: '0.05em',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{
                    borderColor: 'var(--bg-page)',
                    borderTopColor: 'transparent',
                  }} />
                  Authenticating...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 pt-5 text-center" style={{ borderTop: '1px solid var(--accent-border)' }}>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              99HomeBazaar Admin Panel v2.0
            </p>
          </div>
        </div>

        <div className="h-px mt-8 opacity-50" style={{ background: 'linear-gradient(to right, transparent, var(--accent), transparent)' }} />
      </div>
    </div>
  );
}