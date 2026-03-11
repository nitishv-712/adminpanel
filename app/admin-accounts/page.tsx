'use client';
import { useDataCache } from '@/lib/data-cache-context';
import { useEffect, useState, useCallback } from 'react';
import { adminAuthApi } from '@/lib/api';
import { AdminUser } from '@/types';
import { useAuth } from '@/lib/auth-context';
import {
  Card, StatusBadge, Button, Input, Select, Modal, ConfirmModal,
  EmptyState, Spinner, Pagination, Table, Th, Td, Tr, Avatar,
} from '@/components/ui';
import { formatRelativeTime } from '@/lib/utils';
import { ShieldCheck, Search, Plus, Edit2, Trash2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminAccountsPage() {
  const { get, set, invalidatePrefix } = useDataCache();
  const { isSuperAdmin } = useAuth();
  const router = useRouter();

  const [admins, setAdmins]   = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const limit                  = 15;
  const [search, setSearch]   = useState('');
  const [roleFilter, setRole] = useState('');

  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [editRole, setEditRole]     = useState('');
  const [editActive, setEditActive] = useState(true);
  const [saving, setSaving]         = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleting, setDeleting]         = useState(false);

  useEffect(() => {
    if (!isSuperAdmin) { router.push('/dashboard'); return; }
  }, [isSuperAdmin]);

  const fetch = useCallback((force = false) => {
    if (!isSuperAdmin) return;
    const params: any = { page, limit };
    if (search) params.search = search;
    if (roleFilter) params.role = roleFilter;
    const cacheKey = 'admin-accounts:' + JSON.stringify(params);
    if (!force) {
      const cached = get<{ data: AdminUser[]; total: number }>(cacheKey);
      if (cached) { setAdmins(cached.data); setTotal(cached.total); setLoading(false); return; }
    }
    setLoading(true);
    adminAuthApi.listAdmins(params)
      .then(res => {
        const d = res.data.data;
        setAdmins(d.admins); setTotal(d.pagination?.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, [page, get, set, search, roleFilter, isSuperAdmin]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { setPage(1); }, [search, roleFilter]);

  const handleEdit = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      await adminAuthApi.updateAdmin(editTarget._id, { role: editRole, isActive: editActive });
      setEditTarget(null); invalidatePrefix('admin-accounts:'); fetch(true);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminAuthApi.deleteAdmin(deleteTarget._id);
      setDeleteTarget(null); invalidatePrefix('admin-accounts:'); fetch(true);
    } finally { setDeleting(false); }
  };

  const totalPages = Math.ceil(total / limit);
  if (!isSuperAdmin) return null;

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
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between pl-12 sm:pl-0 gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl tracking-widest mb-1"
            style={{ color: 'var(--text-primary)' }}>
            ADMIN ACCOUNTS
          </h1>
          <p className="text-xs uppercase tracking-widest flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
            <ShieldCheck className="w-3.5 h-3.5" /> Superadmin access only
          </p>
        </div>
        <Button variant="primary" onClick={() => router.push('/admin-accounts/rolesgroups')}>
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Admin</span>
        </Button>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 p-3 sm:p-4 rounded-xl border"
        style={{ backgroundColor: 'rgba(251,191,36,0.06)', borderColor: 'rgba(251,191,36,0.15)' }}>
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Admin accounts have access to the full admin panel. Superadmins can also manage other admin accounts.
          Only grant access to trusted team members.
        </p>
      </div>

      {/* Filters */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              placeholder="Search admin name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, width: '100%', paddingLeft: '36px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-strong)'}
            />
          </div>
          <select
            value={roleFilter} onChange={e => setRole(e.target.value)}
            style={{ ...inputStyle, padding: '8px 12px', width: '100%' }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-strong)'}
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Super Admin</option>
          </select>
        </div>
      </Card>

      {/* Table — desktop */}
      <Card className="hidden md:block">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : admins.length === 0 ? (
          <EmptyState icon={<ShieldCheck className="w-7 h-7" />} title="No Admins" description="No admin accounts found." />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Admin</Th>
                  <Th>Role</Th>
                  <Th>Status</Th>
                  <Th>Created By</Th>
                  <Th>Last Login</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {admins.map(a => {
                  const createdBy = typeof a.createdBy === 'object' && a.createdBy !== null ? a.createdBy as AdminUser : null;
                  return (
                    <Tr key={a._id}>
                      <Td>
                        <div className="flex items-center gap-3">
                          <Avatar firstName={a.firstName} lastName={a.lastName} avatar={a.avatar} size="sm" />
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{a.firstName} {a.lastName}</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.email}</p>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <span className="text-xs px-2 py-1 rounded-lg font-medium uppercase tracking-widest"
                          style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                          {typeof a.role === 'object' ? a.role.label : a.role}
                        </span>
                      </Td>
                      <Td>
                        {a.isActive
                          ? <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--accent)' }}><CheckCircle className="w-3.5 h-3.5" />Active</span>
                          : <span className="flex items-center gap-1 text-xs" style={{ color: '#f87171' }}><XCircle className="w-3.5 h-3.5" />Inactive</span>
                        }
                      </Td>
                      <Td>
                        {createdBy
                          ? <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{createdBy.firstName} {createdBy.lastName}</span>
                          : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>}
                      </Td>
                      <Td><span className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.lastLoginAt ? formatRelativeTime(a.lastLoginAt) : 'Never'}</span></Td>
                      <Td>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => { setEditTarget(a); setEditRole(typeof a.role === 'object' ? a.role.name : a.role); setEditActive(a.isActive); }}>
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(a)}>
                            <Trash2 className="w-3.5 h-3.5" style={{ color: '#f87171' }} />
                          </Button>
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
            <div className="px-4 pb-4">
              <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPage={setPage} />
            </div>
          </>
        )}
      </Card>

      {/* Cards — mobile */}
      <div className="flex flex-col gap-3 md:hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : admins.length === 0 ? (
          <EmptyState icon={<ShieldCheck className="w-7 h-7" />} title="No Admins" description="No admin accounts found." />
        ) : (
          <>
            {admins.map(a => {
              const createdBy = typeof a.createdBy === 'object' && a.createdBy !== null ? a.createdBy as AdminUser : null;
              return (
                <Card key={a._id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar firstName={a.firstName} lastName={a.lastName} avatar={a.avatar} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{a.firstName} {a.lastName}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{a.email}</p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-lg font-medium uppercase tracking-widest shrink-0"
                      style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                      {typeof a.role === 'object' ? a.role.label : a.role}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs flex-wrap gap-1">
                    {a.isActive
                      ? <span className="flex items-center gap-1" style={{ color: 'var(--accent)' }}><CheckCircle className="w-3.5 h-3.5" />Active</span>
                      : <span className="flex items-center gap-1" style={{ color: '#f87171' }}><XCircle className="w-3.5 h-3.5" />Inactive</span>
                    }
                    {createdBy && (
                      <span style={{ color: 'var(--text-muted)' }}>By {createdBy.firstName} {createdBy.lastName}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {a.lastLoginAt ? `Last login ${formatRelativeTime(a.lastLoginAt)}` : 'Never logged in'}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setEditTarget(a); setEditRole(typeof a.role === 'object' ? a.role.name : a.role); setEditActive(a.isActive); }}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(a)}>
                        <Trash2 className="w-3.5 h-3.5" style={{ color: '#f87171' }} />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
            <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPage={setPage} />
          </>
        )}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Update Admin" size="sm">
        <div className="space-y-4">
          {editTarget && (
            <div className="flex items-center gap-3 p-3 rounded-xl border"
              style={{ backgroundColor: 'var(--accent-dim)', borderColor: 'var(--accent-border)' }}>
              <Avatar firstName={editTarget.firstName} lastName={editTarget.lastName} />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{editTarget.firstName} {editTarget.lastName}</p>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{editTarget.email}</p>
              </div>
            </div>
          )}
          <Select label="Role" value={editRole} onChange={e => setEditRole(e.target.value)}>
            <option value="admin">Admin</option>
            <option value="superadmin">Super Admin</option>
          </Select>
          <div className="flex items-center justify-between p-3 rounded-xl border"
            style={{ backgroundColor: 'var(--accent-dim)', borderColor: 'var(--accent-border)' }}>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Account Active</span>
            <button onClick={() => setEditActive(!editActive)}
              style={{
                width: '40px', height: '22px', borderRadius: '999px', cursor: 'pointer',
                backgroundColor: editActive ? 'var(--accent)' : 'var(--bg-mid)',
                border: '1px solid var(--border-strong)', position: 'relative', transition: 'background-color 0.2s',
              }}>
              <span style={{
                position: 'absolute', top: '2px', left: editActive ? '20px' : '2px',
                width: '16px', height: '16px', borderRadius: '50%',
                backgroundColor: 'white', transition: 'left 0.2s',
              }} />
            </button>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={handleEdit} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} title="Delete Admin Account"
        message={`Delete "${deleteTarget?.firstName} ${deleteTarget?.lastName}"? They will lose all admin access.`}
        loading={deleting} />
    </div>
  );
}