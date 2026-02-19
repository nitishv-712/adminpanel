'use client';
import { useEffect, useState, useCallback } from 'react';
import { usersApi } from '@/lib/api';
import { User } from '@/types';
import {
  PageHeader, StatusBadge, Pagination,
  ConfirmModal, FilterSelect, SearchInput, Spinner, EmptyState
} from '@/components/ui';
import { Trash2, ShieldCheck, ShieldOff } from 'lucide-react';

const ROLE_OPTS = [
  { value: 'buyer', label: 'Buyer' },
  { value: 'seller', label: 'Seller' },
  { value: 'agent', label: 'Agent' },
  { value: 'admin', label: 'Admin' },
];

export default function UsersPage() {
  const [data, setData] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersApi.list({ page, limit: 15, search: search || undefined, role: role || undefined });
      const d = res.data;
      setData(d.data ?? []);
      setTotal(d.total ?? 0);
      setTotalPages(d.totalPages ?? 1);
    } finally {
      setLoading(false);
    }
  }, [page, search, role]);

  useEffect(() => { setPage(1); }, [search, role]);
  useEffect(() => { load(); }, [load]);

  const updateUser = async (id: string, payload: Record<string, unknown>) => {
    setUpdating(id);
    try {
      await usersApi.update(id, payload);
      await load();
    } finally {
      setUpdating(null);
    }
  };

  const deleteUser = async () => {
    if (!deleteTarget) return;
    await usersApi.delete(deleteTarget);
    setDeleteTarget(null);
    await load();
  };

  const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="animate-fade-in">
      <PageHeader title="Users" sub={`${total.toLocaleString()} registered users`} />

      <div className="card p-4 mb-5 flex flex-wrap gap-3 items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name or email…" />
        <FilterSelect value={role} onChange={setRole} options={ROLE_OPTS} placeholder="All roles" />
        <div className="ml-auto text-ink-400 text-xs">{total} results</div>
      </div>

      <div className="card overflow-hidden">
        {loading ? <Spinner /> : data.length === 0 ? <EmptyState /> : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Verified</th>
                  <th>Joined</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gold-100 flex items-center justify-center text-gold-700 text-xs font-600 shrink-0">
                          {u.firstName?.[0]}{u.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-500 text-ink-800 text-sm">{u.firstName} {u.lastName}</p>
                          <p className="text-ink-400 text-xs">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-ink-500 text-xs">{u.phone ?? '—'}</td>
                    <td>
                      <select
                        value={u.role}
                        onChange={e => updateUser(u._id, { role: e.target.value })}
                        disabled={updating === u._id}
                        className="text-xs border border-ink-200 rounded-lg px-2 py-1 bg-white text-ink-700 focus:outline-none focus:border-gold-400"
                      >
                        {ROLE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </td>
                    <td>
                      <button
                        onClick={() => updateUser(u._id, { isVerified: !u.isVerified })}
                        disabled={updating === u._id}
                        title={u.isVerified ? 'Revoke verification' : 'Verify user'}
                        className={`transition-colors ${u.isVerified ? 'text-emerald-500 hover:text-red-400' : 'text-ink-300 hover:text-emerald-500'}`}
                      >
                        {u.isVerified ? <ShieldCheck className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} /> : <ShieldOff className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />}
                      </button>
                    </td>
                    <td className="text-ink-400 text-xs">{fmtDate(u.createdAt)}</td>
                    <td>
                      <div className="flex justify-end">
                        <button
                          onClick={() => setDeleteTarget(u._id)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
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

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete User"
        message="This will permanently delete the user account and cannot be undone."
        onConfirm={deleteUser}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </div>
  );
}
