'use client';
import { useEffect, useState, useCallback } from 'react';
import { newsletterApi } from '@/lib/api';
import { Subscriber } from '@/types';
import {
  PageHeader, StatusBadge, Pagination,
  FilterSelect, Spinner, EmptyState
} from '@/components/ui';
import { Mail, Download } from 'lucide-react';

const ACTIVE_OPTS = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Unsubscribed' },
];

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function NewsletterPage() {
  const [data, setData] = useState<Subscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await newsletterApi.list({ page, limit: 20, active: active || undefined });
      const d = res.data;
      setData(d.data ?? []);
      setTotal(d.total ?? 0);
      setTotalPages(d.totalPages ?? 1);
    } finally {
      setLoading(false);
    }
  }, [page, active]);

  useEffect(() => { setPage(1); }, [active]);
  useEffect(() => { load(); }, [load]);

  const exportCSV = () => {
    const csv = ['Email,Status,Date Joined', ...data.map(s =>
      `${s.email},${s.isActive ? 'Active' : 'Unsubscribed'},${fmtDate(s.createdAt)}`
    )].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'subscribers.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const activeCount = data.filter(s => s.isActive).length;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Newsletter"
        sub={`${total.toLocaleString()} subscribers`}
        action={
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-ink-900 text-white text-sm hover:bg-ink-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Mail className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-ink-400 uppercase tracking-widest font-500">Active</p>
            <p className="font-display text-xl font-semibold text-ink-900">{total.toLocaleString()}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <Mail className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-xs text-ink-400 uppercase tracking-widest font-500">On this page</p>
            <p className="font-display text-xl font-semibold text-ink-900">{activeCount}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-50 flex items-center justify-center">
            <Mail className="w-5 h-5 text-gold-600" />
          </div>
          <div>
            <p className="text-xs text-ink-400 uppercase tracking-widest font-500">Total Pages</p>
            <p className="font-display text-xl font-semibold text-ink-900">{totalPages}</p>
          </div>
        </div>
      </div>

      <div className="card p-4 mb-5 flex flex-wrap gap-3 items-center">
        <FilterSelect value={active} onChange={setActive} options={ACTIVE_OPTS} placeholder="All subscribers" />
        <div className="ml-auto text-ink-400 text-xs">{total} results</div>
      </div>

      <div className="card overflow-hidden">
        {loading ? <Spinner /> : data.length === 0 ? <EmptyState /> : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Date Subscribed</th>
                </tr>
              </thead>
              <tbody>
                {data.map(s => (
                  <tr key={s._id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${s.isActive ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                          <Mail className={`w-3.5 h-3.5 ${s.isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                        </div>
                        <span className="text-sm text-ink-700 font-500">{s.email}</span>
                      </div>
                    </td>
                    <td><StatusBadge value={String(s.isActive)} label={s.isActive ? 'Active' : 'Unsubscribed'} /></td>
                    <td className="text-ink-400 text-xs">{fmtDate(s.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && data.length > 0 && (
          <div className="px-4 pb-4">
            <Pagination page={page} totalPages={totalPages} onPage={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
