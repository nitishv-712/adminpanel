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

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '', role: 'admin' });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);

  const [editTarget, setEditTarget]   = useState<AdminUser | null>(null);
  const [editRole, setEditRole]       = useState('');
  const [editActive, setEditActive]   = useState(true);
  const [saving, setSaving]           = useState(false);

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
        const d = res.data;
        setAdmins(d.data); setTotal(d.pagination?.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, [page, get, set, search, roleFilter, isSuperAdmin]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { setPage(1); }, [search, roleFilter]);

  const handleCreate = async () => {
    const errs: Record<string, string> = {};
    if (!createForm.firstName) errs.firstName = 'Required';
    if (!createForm.lastName)  errs.lastName  = 'Required';
    if (!createForm.email)     errs.email     = 'Required';
    if (createForm.password.length < 8) errs.password = 'Min 8 characters';
    if (Object.keys(errs).length) { setCreateErrors(errs); return; }
    setCreating(true);
    try {
      await adminAuthApi.createAdmin(createForm);
      setShowCreate(false);
      setCreateForm({ firstName: '', lastName: '', email: '', password: '', phone: '', role: 'admin' });
      fetch();
    } catch (e: any) {
      setCreateErrors({ email: e.response?.data?.message ?? 'Failed to create' });
    } finally { setCreating(false); }
  };

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
    try { await adminAuthApi.deleteAdmin(deleteTarget._id); setDeleteTarget(null); invalidatePrefix('admin-accounts:'); fetch(true); }
    finally { setDeleting(false); }
  };

  const totalPages = Math.ceil(total / limit);
  if (!isSuperAdmin) return null;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-4xl tracking-widest mb-1" style={{ color: 'var(--text-primary)' }}>
            ADMIN ACCOUNTS
          </h1>
          <p className="text-xs uppercase tracking-widest flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
            <ShieldCheck className="w-3.5 h-3.5" /> Superadmin access only
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> Add Admin
        </Button>
      </div>

      {/* Warning notice */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '12px',
        padding: '16px',
        backgroundColor: 'rgba(251,191,36,0.06)',
        border: '1px solid rgba(251,191,36,0.15)',
        borderRadius: '12px',
      }}>
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Admin accounts have access to the full admin panel. Superadmins can also manage other admin accounts.
          Only grant access to trusted team members.
        </p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              placeholder="Search admin name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '36px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px',
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
          <select
            value={roleFilter}
            onChange={e => setRole(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--input-bg)',
              border: '1px solid var(--border-strong)',
              borderRadius: '12px',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
              minWidth: '150px',
              transition: 'border-color 0.2s',
            }}
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Super Admin</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card>
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
                      <Td><StatusBadge value={a.role} /></Td>
                      <Td>
                        {a.isActive
                          ? <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--accent)' }}><CheckCircle className="w-3.5 h-3.5" />Active</span>
                          : <span className="flex items-center gap-1 text-xs" style={{ color: '#f87171' }}><XCircle className="w-3.5 h-3.5" />Inactive</span>
                        }
                      </Td>
                      <Td>
                        {createdBy
                          ? <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{createdBy.firstName} {createdBy.lastName}</span>
                          : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                        }
                      </Td>
                      <Td><span className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.lastLoginAt ? formatRelativeTime(a.lastLoginAt) : 'Never'}</span></Td>
                      <Td>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => { setEditTarget(a); setEditRole(a.role); setEditActive(a.isActive); }}>
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

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Admin Account">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First Name" value={createForm.firstName} error={createErrors.firstName}
              onChange={e => setCreateForm(f => ({ ...f, firstName: e.target.value }))} />
            <Input label="Last Name" value={createForm.lastName} error={createErrors.lastName}
              onChange={e => setCreateForm(f => ({ ...f, lastName: e.target.value }))} />
          </div>
          <Input label="Email" type="email" value={createForm.email} error={createErrors.email}
            onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} />
          <Input label="Password (min 8 chars)" type="password" value={createForm.password} error={createErrors.password}
            onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} />
          <Input label="Phone (optional)" value={createForm.phone}
            onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))} />
          <Select label="Role" value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}>
            <option value="admin">Admin</option>
            <option value="superadmin">Super Admin</option>
          </Select>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating...' : 'Create Admin'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Update Admin" size="sm">
        <div className="space-y-4">
          {editTarget && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px',
              backgroundColor: 'var(--accent-dim)',
              border: '1px solid var(--accent-border)',
              borderRadius: '12px',
            }}>
              <Avatar firstName={editTarget.firstName} lastName={editTarget.lastName} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{editTarget.firstName} {editTarget.lastName}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{editTarget.email}</p>
              </div>
            </div>
          )}
          <Select label="Role" value={editRole} onChange={e => setEditRole(e.target.value)}>
            <option value="admin">Admin</option>
            <option value="superadmin">Super Admin</option>
          </Select>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px',
            backgroundColor: 'var(--accent-dim)',
            border: '1px solid var(--accent-border)',
            borderRadius: '12px',
          }}>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Account Active</span>
            <button
              onClick={() => setEditActive(!editActive)}
              style={{
                width: '40px', height: '22px',
                borderRadius: '999px',
                backgroundColor: editActive ? 'var(--accent)' : 'var(--bg-mid)',
                border: '1px solid var(--border-strong)',
                position: 'relative',
                transition: 'background-color 0.2s',
                cursor: 'pointer',
              }}
            >
              <span style={{
                position: 'absolute', top: '2px',
                left: editActive ? '20px' : '2px',
                width: '16px', height: '16px',
                borderRadius: '50%',
                backgroundColor: 'white',
                transition: 'left 0.2s',
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

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Admin Account"
        message={`Delete "${deleteTarget?.firstName} ${deleteTarget?.lastName}"? They will lose all admin access.`}
        loading={deleting}
      />
    </div>
  );
}