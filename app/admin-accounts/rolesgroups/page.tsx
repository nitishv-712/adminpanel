'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { rolesApi, adminAuthApi } from '@/lib/api';
import {
  Card, Button, Input, Modal, ConfirmModal,
  EmptyState, Spinner, Avatar,
} from '@/components/ui';
import {
  ShieldCheck, Users, Plus, Edit2, Trash2, ChevronDown, ChevronRight,
  Lock, Unlock, UserPlus, UserMinus, AlertTriangle, Check, X, UserCog,
} from 'lucide-react';

interface Permission { resource: string; actions: Record<string, boolean> }
interface Role {
  _id: string; name: string; label: string; isLocked: boolean;
  permissions: Permission[];
  createdBy?: { firstName: string; lastName: string; email: string };
}
interface GroupMember {
  _id: string; firstName: string; lastName: string; email: string;
  avatar?: string; isActive: boolean;
}
interface Group {
  _id: string; name: string; description?: string; isActive: boolean;
  role: { _id: string; name: string; label: string };
  permissions: Permission[];
  members: GroupMember[];
  createdBy?: { firstName: string; lastName: string };
}

type Tab = 'roles' | 'groups' | 'admins';

export default function RolesGroupsPage() {
  const { isSuperAdmin } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('roles');

  useEffect(() => {
    if (!isSuperAdmin) router.push('/dashboard');
  }, [isSuperAdmin]);
  if (!isSuperAdmin) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-4xl tracking-widest mb-1" style={{ color: 'var(--text-primary)' }}>
            ROLES & GROUPS
          </h1>
          <p className="text-xs uppercase tracking-widest flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
            <ShieldCheck className="w-3.5 h-3.5" /> Access control management
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: 'var(--bg-mid)', border: '1px solid var(--border-strong)' }}>
        {([
          { key: 'roles',  icon: <ShieldCheck className="w-3.5 h-3.5" />, label: 'Roles'        },
          { key: 'groups', icon: <Users className="w-3.5 h-3.5" />,       label: 'Groups'       },
          { key: 'admins', icon: <UserCog className="w-3.5 h-3.5" />,     label: 'Create Admin' },
        ] as { key: Tab; icon: React.ReactNode; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-5 py-2 rounded-lg text-xs font-semibold uppercase tracking-widest transition-all"
            style={{
              backgroundColor: tab === t.key ? 'var(--accent)' : 'transparent',
              color: tab === t.key ? 'var(--bg-page)' : 'var(--text-muted)',
            }}
          >
            <span className="flex items-center gap-1.5">{t.icon}{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'roles'  && <RolesTab />}
      {tab === 'groups' && <GroupsTab />}
      {tab === 'admins' && <CreateAdminTab />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLES TAB
// ─────────────────────────────────────────────────────────────────────────────
function RolesTab() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [resourceActions, setResourceActions] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Role | null>(null);
  const [pendingPerms, setPendingPerms] = useState<Record<string, Record<string, boolean>>>({});
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', label: '', description: '' });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, raRes] = await Promise.all([rolesApi.list(), rolesApi.getResourceActions()]);
      setRoles(rolesRes.data.data.roles);
      setResourceActions(raRes.data.data.resourceActions);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    const errs: Record<string, string> = {};
    if (!createForm.name)  errs.name  = 'Required';
    if (!createForm.label) errs.label = 'Required';
    if (createForm.name && !/^[a-z0-9_-]+$/.test(createForm.name))
      errs.name = 'Lowercase, no spaces (a-z, 0-9, _ or -)';
    if (Object.keys(errs).length) { setCreateErrors(errs); return; }
    setCreating(true);
    try {
      await rolesApi.create({ name: createForm.name, label: createForm.label, description: createForm.description || undefined });
      setShowCreate(false);
      setCreateForm({ name: '', label: '', description: '' });
      load();
    } catch (e: any) {
      setCreateErrors({ name: e.response?.data?.message ?? 'Failed to create' });
    } finally { setCreating(false); }
  };

  const openEdit = (role: Role) => {
    const map: Record<string, Record<string, boolean>> = {};
    for (const p of role.permissions) map[p.resource] = { ...p.actions };
    setPendingPerms(map);
    setEditTarget(role);
  };

  const toggleAction = (resource: string, action: string) => {
    setPendingPerms(prev => ({
      ...prev,
      [resource]: { ...(prev[resource] ?? {}), [action]: !(prev[resource]?.[action] ?? false) },
    }));
  };

  const handleSave = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      await rolesApi.updatePermissions(editTarget._id, pendingPerms);
      setEditTarget(null);
      load();
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> New Role
        </Button>
      </div>

      {roles.length === 0 ? (
        <EmptyState icon={<ShieldCheck className="w-7 h-7" />} title="No Roles Found" description='Click "New Role" to create your first role.' />
      ) : roles.map(role => (
        <Card key={role._id} className="overflow-hidden">
          <div
            className="flex items-center justify-between p-4 cursor-pointer transition-colors hover:bg-[var(--accent-dim)]"
            onClick={() => setExpanded(expanded === role._id ? null : role._id)}
          >
            <div className="flex items-center gap-3">
              {role.isLocked
                ? <Lock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                : <Unlock className="w-4 h-4" style={{ color: 'var(--accent)' }} />}
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{role.label}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{role.name}</p>
              </div>
              {role.isLocked && (
                <span className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest font-semibold"
                  style={{ backgroundColor: 'rgba(251,191,36,0.1)', color: '#f59e0b', border: '1px solid rgba(251,191,36,0.2)' }}>
                  Locked
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!role.isLocked && (
                <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); openEdit(role); }}>
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
              )}
              {expanded === role._id
                ? <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                : <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
            </div>
          </div>
          {expanded === role._id && (
            <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: 'var(--border-strong)' }}>
              <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Permissions</p>
              <PermissionMatrix permissions={role.permissions} resourceActions={resourceActions} readonly />
            </div>
          )}
        </Card>
      ))}

      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title={`Edit: ${editTarget?.label}`} size="lg">
        {editTarget && (
          <div className="space-y-4">
            <PermissionMatrix
              permissions={Object.entries(pendingPerms).map(([resource, actions]) => ({ resource, actions }))}
              resourceActions={resourceActions}
              onToggle={toggleAction}
            />
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditTarget(null)}>Cancel</Button>
              <Button variant="primary" className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Permissions'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setCreateErrors({}); }} title="Create Role">
        <div className="space-y-4">
          <Input label="Name (system key)" value={createForm.name} error={createErrors.name}
            placeholder="e.g. content_editor"
            onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} />
          <Input label="Label (display name)" value={createForm.label} error={createErrors.label}
            placeholder="e.g. Content Editor"
            onChange={e => setCreateForm(f => ({ ...f, label: e.target.value }))} />
          <Input label="Description (optional)" value={createForm.description}
            onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => { setShowCreate(false); setCreateErrors({}); }}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating...' : 'Create Role'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PERMISSION MATRIX
// ─────────────────────────────────────────────────────────────────────────────
function PermissionMatrix({
  permissions, resourceActions, readonly = false, onToggle,
}: {
  permissions: Permission[];
  resourceActions: Record<string, string[]>;
  readonly?: boolean;
  onToggle?: (resource: string, action: string) => void;
}) {
  const permMap: Record<string, Record<string, boolean>> = {};
  for (const p of permissions) permMap[p.resource] = p.actions;
  const allResources = Object.keys(resourceActions);
  const cols = ['read', 'create', 'update', 'delete', 'approve', 'archive', 'export'];

  return (
    <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border-strong)' }}>
      <table className="w-full text-xs">
        <thead>
          <tr style={{ backgroundColor: 'var(--bg-mid)' }}>
            <th className="text-left px-4 py-2.5 font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Resource</th>
            {cols.map(a => (
              <th key={a} className="px-3 py-2.5 text-center font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{a}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allResources.map((resource, i) => {
            const actions = resourceActions[resource];
            const current = permMap[resource] ?? {};
            return (
              <tr key={resource} style={{ borderTop: i > 0 ? '1px solid var(--border-strong)' : undefined }}>
                <td className="px-4 py-2.5 font-medium" style={{ color: 'var(--text-secondary)' }}>{resource}</td>
                {cols.map(action => {
                  const supported = actions.includes(action);
                  const enabled = current[action] ?? false;
                  return (
                    <td key={action} className="px-3 py-2.5 text-center">
                      {!supported ? (
                        <span style={{ color: 'var(--border-strong)' }}>—</span>
                      ) : readonly ? (
                        enabled
                          ? <Check className="w-3.5 h-3.5 mx-auto" style={{ color: 'var(--accent)' }} />
                          : <X className="w-3.5 h-3.5 mx-auto" style={{ color: 'var(--text-muted)' }} />
                      ) : (
                        <button
                          onClick={() => onToggle?.(resource, action)}
                          className="w-5 h-5 rounded flex items-center justify-center mx-auto transition-all"
                          style={{
                            backgroundColor: enabled ? 'var(--accent)' : 'var(--bg-mid)',
                            border: `1px solid ${enabled ? 'var(--accent)' : 'var(--border-strong)'}`,
                          }}
                        >
                          {enabled && <Check className="w-3 h-3" style={{ color: 'var(--bg-page)' }} />}
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GROUPS TAB
// ─────────────────────────────────────────────────────────────────────────────
function GroupsTab() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [roles, setRoles]   = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', role: '', description: '' });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const [editTarget, setEditTarget] = useState<Group | null>(null);
  const [editForm, setEditForm]     = useState({ name: '', description: '' });
  const [saving, setSaving]         = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null);
  const [deleting, setDeleting]         = useState(false);
  const [memberGroupId, setMemberGroupId] = useState<string | null>(null);
  const [memberAdminId, setMemberAdminId] = useState('');
  const [memberLoading, setMemberLoading] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [gRes, rRes] = await Promise.all([
        rolesApi.listGroups(roleFilter ? { role: roleFilter } : undefined),
        rolesApi.list(),
      ]);
      setGroups(gRes.data.data.groups);
      setRoles(rRes.data.data.roles);
    } finally { setLoading(false); }
  }, [roleFilter]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    const errs: Record<string, string> = {};
    if (!createForm.name) errs.name = 'Required';
    if (!createForm.role) errs.role = 'Required';
    if (Object.keys(errs).length) { setCreateErrors(errs); return; }
    setCreating(true);
    try {
      await rolesApi.createGroup({ name: createForm.name, role: createForm.role, description: createForm.description || undefined });
      setShowCreate(false);
      setCreateForm({ name: '', role: '', description: '' });
      load();
    } catch (e: any) {
      setCreateErrors({ name: e.response?.data?.message ?? 'Failed to create' });
    } finally { setCreating(false); }
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      await rolesApi.updateGroup(editTarget._id, { name: editForm.name, description: editForm.description });
      setEditTarget(null); load();
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await rolesApi.deleteGroup(deleteTarget._id); setDeleteTarget(null); load(); }
    finally { setDeleting(false); }
  };

  const handleAddMember = async () => {
    if (!memberGroupId || !memberAdminId.trim()) return;
    setMemberLoading(true);
    try {
      await rolesApi.addMember(memberGroupId, memberAdminId.trim());
      setMemberGroupId(null); setMemberAdminId(''); load();
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Failed to add member');
    } finally { setMemberLoading(false); }
  };

  const handleRemoveMember = async (groupId: string, adminId: string) => {
    setRemovingMemberId(adminId);
    try { await rolesApi.removeMember(groupId, adminId); load(); }
    finally { setRemovingMemberId(null); }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          style={{
            padding: '8px 12px', backgroundColor: 'var(--input-bg)',
            border: '1px solid var(--border-strong)', borderRadius: '12px',
            color: 'var(--text-primary)', fontSize: '14px', outline: 'none', minWidth: '160px',
          }}>
          <option value="">All Roles</option>
          {roles.map(r => <option key={r._id} value={r._id}>{r.label}</option>)}
        </select>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> New Group
        </Button>
      </div>

      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px',
        backgroundColor: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: '12px',
      }}>
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Groups inherit their role's permissions and can have additional overrides. Deactivating a group does not remove members — they fall back to their base role.
        </p>
      </div>

      {groups.length === 0 ? (
        <EmptyState icon={<Users className="w-7 h-7" />} title="No Groups" description="Create a group to assign members with shared permissions." />
      ) : groups.map(group => (
        <Card key={group._id} className="overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => setExpanded(expanded === group._id ? null : group._id)}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: group.isActive ? 'var(--accent-dim)' : 'var(--bg-mid)', border: '1px solid var(--accent-border)' }}>
                <Users className="w-4 h-4" style={{ color: group.isActive ? 'var(--accent)' : 'var(--text-muted)' }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{group.name}</p>
                  {!group.isActive && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest font-semibold"
                      style={{ backgroundColor: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {group.role.label} · {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                  {group.description ? ` · ${group.description}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 ml-3">
              {group.isActive && (
                <Button variant="ghost" size="sm" onClick={() => setMemberGroupId(group._id)}>
                  <UserPlus className="w-3.5 h-3.5" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => { setEditTarget(group); setEditForm({ name: group.name, description: group.description ?? '' }); }}>
                <Edit2 className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(group)}>
                <Trash2 className="w-3.5 h-3.5" style={{ color: '#f87171' }} />
              </Button>
              {expanded === group._id
                ? <ChevronDown className="w-4 h-4 ml-1" style={{ color: 'var(--text-muted)' }} />
                : <ChevronRight className="w-4 h-4 ml-1" style={{ color: 'var(--text-muted)' }} />}
            </div>
          </div>

          {expanded === group._id && (
            <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: 'var(--border-strong)' }}>
              <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Members</p>
              {group.members.length === 0
                ? <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No members yet.</p>
                : (
                  <div className="flex flex-wrap gap-2">
                    {group.members.map(m => (
                      <div key={m._id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                        style={{ backgroundColor: 'var(--bg-mid)', border: '1px solid var(--border-strong)' }}>
                        <Avatar firstName={m.firstName} lastName={m.lastName} avatar={m.avatar} size="sm" />
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{m.firstName} {m.lastName}</span>
                        <button onClick={() => handleRemoveMember(group._id, m._id)} disabled={removingMemberId === m._id}
                          className="transition-opacity hover:opacity-70">
                          {removingMemberId === m._id
                            ? <Spinner size="sm" />
                            : <UserMinus className="w-3 h-3" style={{ color: '#f87171' }} />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          )}
        </Card>
      ))}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Group">
        <div className="space-y-4">
          <Input label="Group Name" value={createForm.name} error={createErrors.name}
            onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} />
          <Input label="Description (optional)" value={createForm.description}
            onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} />
          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Role *</label>
            <select value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}
              style={{
                width: '100%', padding: '10px 12px', backgroundColor: 'var(--input-bg)',
                border: `1px solid ${createErrors.role ? '#f87171' : 'var(--border-strong)'}`,
                borderRadius: '12px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
              }}>
              <option value="">Select a role...</option>
              {roles.map(r => <option key={r._id} value={r._id}>{r.label}</option>)}
            </select>
            {createErrors.role && <p className="text-xs" style={{ color: '#f87171' }}>{createErrors.role}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating...' : 'Create Group'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Group" size="sm">
        <div className="space-y-4">
          <Input label="Group Name" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
          <Input label="Description" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={handleEdit} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!memberGroupId} onClose={() => setMemberGroupId(null)} title="Add Member" size="sm">
        <div className="space-y-4">
          <Input label="Admin ID" value={memberAdminId} placeholder="Paste admin _id here"
            onChange={e => setMemberAdminId(e.target.value)} />
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            The admin's role must match this group's role. Find the admin ID in the Admin Accounts page.
          </p>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setMemberGroupId(null)}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={handleAddMember} disabled={memberLoading}>
              {memberLoading ? 'Adding...' : 'Add Member'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Deactivate Group"
        message={`Deactivate "${deleteTarget?.name}"? Members will fall back to their base role permissions.`}
        loading={deleting}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE ADMIN TAB
// ─────────────────────────────────────────────────────────────────────────────
function CreateAdminTab() {
  const [roles, setRoles]   = useState<Role[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '',
    phone: '', role: '', group: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, gRes] = await Promise.all([rolesApi.list(), rolesApi.listGroups()]);
      setRoles(rRes.data.data.roles);
      setGroups(gRes.data.data.groups.filter((g: Group) => g.isActive));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Only show groups that match the selected role
  const filteredGroups = form.role ? groups.filter(g => g.role._id === form.role) : groups;

  const handleSubmit = async () => {
    const errs: Record<string, string> = {};
    if (!form.firstName) errs.firstName = 'Required';
    if (!form.lastName)  errs.lastName  = 'Required';
    if (!form.email)     errs.email     = 'Required';
    if (form.password.length < 8) errs.password = 'Min 8 characters';
    if (!form.role)      errs.role      = 'Required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setCreating(true);
    try {
      const payload: any = {
        firstName: form.firstName, lastName: form.lastName,
        email: form.email, password: form.password, role: form.role,
      };
      if (form.phone) payload.phone = form.phone;

      const res = await adminAuthApi.createAdmin(payload);
      const newAdminId = res.data.data.admin._id;

      if (form.group) await rolesApi.addMember(form.group, newAdminId);

      const roleName  = roles.find(r => r._id === form.role)?.label ?? '';
      const groupName = groups.find(g => g._id === form.group)?.name;
      setSuccessMsg(`Admin created as ${roleName}${groupName ? ` in group "${groupName}"` : ''}.`);
      setForm({ firstName: '', lastName: '', email: '', password: '', phone: '', role: '', group: '' });
      setErrors({});
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (e: any) {
      setErrors({ email: e.response?.data?.message ?? 'Failed to create admin' });
    } finally { setCreating(false); }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-xl space-y-5">
      {successMsg && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px', padding: '14px',
          backgroundColor: 'rgba(0,229,200,0.06)', border: '1px solid var(--accent-border)', borderRadius: '12px',
        }}>
          <Check className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
          <p className="text-xs font-medium" style={{ color: 'var(--accent)' }}>{successMsg}</p>
        </div>
      )}

      <Card className="p-6">
        <p className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: 'var(--text-muted)' }}>Personal Info</p>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First Name" value={form.firstName} error={errors.firstName}
              onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
            <Input label="Last Name" value={form.lastName} error={errors.lastName}
              onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
          </div>
          <Input label="Email" type="email" value={form.email} error={errors.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <Input label="Password (min 8 chars)" type="password" value={form.password} error={errors.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          <Input label="Phone (optional)" value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
        </div>
      </Card>

      <Card className="p-6">
        <p className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: 'var(--text-muted)' }}>Role & Group Assignment</p>
        <div className="space-y-4">
          {/* Role */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Role *</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value, group: '' }))}
              style={{
                width: '100%', padding: '10px 12px', backgroundColor: 'var(--input-bg)',
                border: `1px solid ${errors.role ? '#f87171' : 'var(--border-strong)'}`,
                borderRadius: '12px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
              }}>
              <option value="">Select a role...</option>
              {roles.map(r => <option key={r._id} value={r._id}>{r.label}</option>)}
            </select>
            {errors.role && <p className="text-xs" style={{ color: '#f87171' }}>{errors.role}</p>}
          </div>

          {/* Group — only shown when role is selected */}
          {form.role && (
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Group <span style={{ fontWeight: 400 }}>(optional)</span>
              </label>
              {filteredGroups.length === 0 ? (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No active groups for this role.</p>
              ) : (
                <select value={form.group} onChange={e => setForm(f => ({ ...f, group: e.target.value }))}
                  style={{
                    width: '100%', padding: '10px 12px', backgroundColor: 'var(--input-bg)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: '12px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
                  }}>
                  <option value="">No group (role permissions only)</option>
                  {filteredGroups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                </select>
              )}
            </div>
          )}

          {/* Assignment summary */}
          {form.role && (
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-widest"
                style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                {roles.find(r => r._id === form.role)?.label}
              </span>
              {form.group && (
                <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-widest"
                  style={{ backgroundColor: 'var(--bg-mid)', color: 'var(--text-secondary)', border: '1px solid var(--border-strong)' }}>
                  {groups.find(g => g._id === form.group)?.name}
                </span>
              )}
            </div>
          )}
        </div>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1"
          onClick={() => { setForm({ firstName: '', lastName: '', email: '', password: '', phone: '', role: '', group: '' }); setErrors({}); }}>
          Reset
        </Button>
        <Button variant="primary" className="flex-1" onClick={handleSubmit} disabled={creating}>
          <UserCog className="w-4 h-4" />
          {creating ? 'Creating...' : 'Create Admin'}
        </Button>
      </div>
    </div>
  );
}