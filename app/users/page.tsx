'use client';
import { useEffect, useState, useCallback } from 'react';
import { useDataCache } from '@/lib/data-cache-context';
import { usersApi } from '@/lib/api';
import { User } from '@/types';
import {
  Card, StatusBadge, Button, Select, Modal, ConfirmModal,
  EmptyState, Spinner, Pagination, Table, Th, Td, Tr, Avatar,
} from '@/components/ui';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { Users as UsersIcon, Search, Edit2, Trash2, Mail, Phone, CheckCircle, XCircle } from 'lucide-react';

export default function UsersPage() {
  const { get, set, invalidatePrefix } = useDataCache();
  const [users, setUsers]     = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const limit                  = 15;
  const [search, setSearch]   = useState('');
  const [roleFilter, setRole] = useState('');

  const [editTarget, setEditTarget]         = useState<User | null>(null);
  const [editRole, setEditRole]             = useState('');
  const [editVerified, setEditVerified]     = useState(false);
  const [saving, setSaving]                 = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting]         = useState(false);

  const fetch = useCallback((force = false) => {
    const params: any = { page, limit };
    if (search) params.search = search;
    if (roleFilter) params.role = roleFilter;
    const cacheKey = 'users:' + JSON.stringify(params);
    if (!force) {
      const cached = get<{ data: User[]; total: number }>(cacheKey);
      if (cached) { setUsers(cached.data); setTotal(cached.total); setLoading(false); return; }
    }
    setLoading(true);
    setError('');
    usersApi.list(params)
      .then(res => {
        const d = res.data?.data;
        const result = { data: d?.data ?? [], total: d?.total ?? 0 };
        set(cacheKey, result);
        setUsers(result.data);
        setTotal(result.total);
      })
      .catch(err => setError(err.response?.data?.message || 'Failed to load users'))
      .finally(() => setLoading(false));
  }, [page, search, roleFilter, get, set]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { setPage(1); }, [search, roleFilter]);

  const openEdit = (u: User) => {
    setEditTarget(u);
    setEditRole(u.role);
    setEditVerified(u.isVerified);
  };

  const handleSave = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      await usersApi.update(editTarget._id, { role: editRole, isVerified: editVerified });
      setEditTarget(null); invalidatePrefix('users:'); fetch(true);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await usersApi.delete(deleteTarget._id); setDeleteTarget(null); invalidatePrefix('users:'); fetch(true); }
    finally { setDeleting(false); }
  };

  const totalPages = Math.ceil(total / limit);

  const inputStyle = {
    backgroundColor: 'var(--input-bg)',
    border: '1px solid var(--border-strong)',
    borderRadius: '12px',
    color: 'var(--text-primary)',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-4xl tracking-widest mb-1" style={{ color: 'var(--text-primary)' }}>
            WEB USERS
          </h1>
          <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Registered website users
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl tracking-wide" style={{ color: 'var(--accent)' }}>{total}</p>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Total Users</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              placeholder="Search name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, width: '100%', paddingLeft: '36px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-strong)'}
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => setRole(e.target.value)}
            style={{ ...inputStyle, padding: '8px 12px', minWidth: '130px' }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-strong)'}
          >
            <option value="">All Roles</option>
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
            <option value="agent">Agent</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : error ? (
          <div className="flex justify-center py-16 text-sm" style={{ color: '#f87171' }}>{error}</div>
        ) : users.length === 0 ? (
          <EmptyState icon={<UsersIcon className="w-7 h-7" />} title="No Users" description="No users match your search." />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>User</Th>
                  <Th>Contact</Th>
                  <Th>Role</Th>
                  <Th>Verified</Th>
                  <Th>Joined</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <Tr key={u._id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar firstName={u.firstName} lastName={u.lastName} avatar={u.avatar} size="sm" />
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{u.firstName} {u.lastName}</p>
                          <p className="text-xs truncate max-w-[180px]" style={{ color: 'var(--text-muted)' }}>{u.email}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <div className="space-y-0.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{u.email}</div>
                        {u.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{u.phone}</div>}
                      </div>
                    </Td>
                    <Td><StatusBadge value={u.role} /></Td>
                    <Td>
                      {u.isVerified
                        ? <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--accent)' }}><CheckCircle className="w-3.5 h-3.5" />Verified</span>
                        : <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}><XCircle className="w-3.5 h-3.5" />Unverified</span>
                      }
                    </Td>
                    <Td><span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatRelativeTime(u.createdAt)}</span></Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(u)}><Edit2 className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(u)}>
                          <Trash2 className="w-3.5 h-3.5" style={{ color: '#f87171' }} />
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <div className="px-4 pb-4">
              <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPage={setPage} />
            </div>
          </>
        )}
      </Card>

      {/* Edit Modal */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Update User">
        <div className="space-y-4">
          {editTarget && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
              backgroundColor: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: '12px',
            }}>
              <Avatar firstName={editTarget.firstName} lastName={editTarget.lastName} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{editTarget.firstName} {editTarget.lastName}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{editTarget.email}</p>
              </div>
            </div>
          )}
          <Select label="Role" value={editRole} onChange={e => setEditRole(e.target.value)}>
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
            <option value="agent">Agent</option>
          </Select>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px',
            backgroundColor: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: '12px',
          }}>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Verified</span>
            <button
              onClick={() => setEditVerified(!editVerified)}
              style={{
                width: '40px', height: '22px', borderRadius: '999px', cursor: 'pointer',
                backgroundColor: editVerified ? 'var(--accent)' : 'var(--bg-mid)',
                border: '1px solid var(--border-strong)',
                position: 'relative', transition: 'background-color 0.2s',
              }}
            >
              <span style={{
                position: 'absolute', top: '2px',
                left: editVerified ? '20px' : '2px',
                width: '16px', height: '16px',
                borderRadius: '50%', backgroundColor: 'white',
                transition: 'left 0.2s',
              }} />
            </button>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Delete "${deleteTarget?.firstName} ${deleteTarget?.lastName}"? All their data will be removed.`}
        loading={deleting}
      />
    </div>
  );
}