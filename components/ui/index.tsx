'use client';
import { ReactNode } from 'react';
import clsx from 'clsx';

// ─── Badge ────────────────────────────────────────────────────
const statusColors: Record<string, string> = {
  active:   'bg-emerald-100 text-emerald-700',
  pending:  'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
  sold:     'bg-blue-100 text-blue-700',
  rented:   'bg-purple-100 text-purple-700',
  archived: 'bg-gray-100 text-gray-600',
  new:      'bg-sky-100 text-sky-700',
  read:     'bg-slate-100 text-slate-600',
  replied:  'bg-indigo-100 text-indigo-700',
  closed:   'bg-gray-100 text-gray-500',
  buyer:    'bg-teal-100 text-teal-700',
  seller:   'bg-violet-100 text-violet-700',
  agent:    'bg-orange-100 text-orange-700',
  admin:    'bg-rose-100 text-rose-700',
  sale:     'bg-emerald-100 text-emerald-700',
  rent:     'bg-blue-100 text-blue-700',
  true:     'bg-emerald-100 text-emerald-700',
  false:    'bg-gray-100 text-gray-500',
};

export function StatusBadge({ value, label }: { value: string; label?: string }) {
  return (
    <span className={clsx('badge', statusColors[value] ?? 'bg-gray-100 text-gray-600')}>
      {label ?? value}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────
export function StatCard({
  label, value, sub, icon, accent
}: { label: string; value: string | number; sub?: string; icon: ReactNode; accent?: string }) {
  return (
    <div className={clsx('card p-5 flex items-start gap-4', accent)}>
      <div className="w-11 h-11 rounded-xl bg-ink-50 flex items-center justify-center text-ink-600 shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-ink-400 text-xs uppercase tracking-widest font-500 mb-0.5">{label}</p>
        <p className="font-display text-2xl font-semibold text-ink-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        {sub && <p className="text-ink-400 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────
export function ConfirmModal({
  open, title, message, onConfirm, onCancel, danger
}: {
  open: boolean; title: string; message: string;
  onConfirm: () => void; onCancel: () => void; danger?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl animate-slide-up">
        <h3 className="font-display text-lg font-semibold text-ink-900 mb-2">{title}</h3>
        <p className="text-ink-500 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 border border-ink-200 text-ink-600 rounded-xl py-2.5 text-sm hover:bg-ink-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={clsx('flex-1 rounded-xl py-2.5 text-sm font-500 transition-colors', danger ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gold-500 hover:bg-gold-400 text-ink-950')}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────
export function Pagination({
  page, totalPages, onPage
}: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="px-3 py-1.5 text-sm rounded-lg border border-ink-200 text-ink-600 hover:bg-ink-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Prev
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(p => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
        .map((p, idx, arr) => (
          <span key={p}>
            {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-ink-400 px-1">…</span>}
            <button
              onClick={() => onPage(p)}
              className={clsx(
                'w-8 h-8 rounded-lg text-sm transition-colors',
                p === page ? 'bg-gold-500 text-ink-950 font-600' : 'border border-ink-200 text-ink-600 hover:bg-ink-50'
              )}
            >
              {p}
            </button>
          </span>
        ))}
      <button
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        className="px-3 py-1.5 text-sm rounded-lg border border-ink-200 text-ink-600 hover:bg-ink-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Next
      </button>
    </div>
  );
}

// ─── Page Header ──────────────────────────────────────────────
export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-7">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900">{title}</h1>
        {sub && <p className="text-ink-400 text-sm mt-1">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Search Input ─────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder ?? 'Search…'}
      className="border border-ink-200 rounded-xl px-4 py-2 text-sm text-ink-700 placeholder-ink-400 focus:border-gold-400 focus:outline-none bg-white w-64 transition-colors"
    />
  );
}

// ─── Select ───────────────────────────────────────────────────
export function FilterSelect({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="border border-ink-200 rounded-xl px-3 py-2 text-sm text-ink-700 focus:border-gold-400 focus:outline-none bg-white transition-colors"
    >
      <option value="">{placeholder ?? 'All'}</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ─── Empty State ──────────────────────────────────────────────
export function EmptyState({ message }: { message?: string }) {
  return (
    <div className="py-16 text-center text-ink-400 text-sm">
      {message ?? 'No results found.'}
    </div>
  );
}

// ─── Loading Spinner ──────────────────────────────────────────
export function Spinner() {
  return (
    <div className="py-16 flex justify-center">
      <div className="w-7 h-7 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
