'use client';
import { useDataCache } from '@/lib/data-cache-context';
import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { auditLogsApi } from '@/lib/api';
import {
  Card, Button, Modal, ConfirmModal,
  EmptyState, Spinner, Pagination, Table, Th, Td, Tr, Avatar, Textarea,
} from '@/components/ui';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { ShieldAlert, Eye, Trash2, Flag, StickyNote, Activity, Globe, Monitor, Tag, Clock, ArrowRight, User } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AdminSnapshot {
  fullName:  string;
  email:     string;
  roleName:  string | null;
  groupName: string | null;
}

// All diff values come back as plain JSON — type them as serialisable so they
// never leak `unknown` into JSX.
type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

interface AuditLogEntry {
  _id:           string;
  admin?:        { _id: string; firstName: string; lastName: string; email: string; avatar?: string; isActive?: boolean };
  adminSnapshot: AdminSnapshot;
  resource:      string;
  action:        string;
  targetId?:     string | null;
  targetLabel?:  string | null;
  diff:          { before?: JsonValue; after?: JsonValue };
  ip?:           string | null;
  userAgent?:    string | null;
  status:        'success' | 'failed';
  errorMessage?: string | null;
  note?:         string | null;
  flagged?:      boolean;
  createdAt:     string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ACTION_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  create: { bg: 'rgba(34,197,94,0.08)',  color: '#22c55e', border: 'rgba(34,197,94,0.2)'  },
  update: { bg: 'rgba(59,130,246,0.08)', color: '#60a5fa', border: 'rgba(59,130,246,0.2)' },
  delete: { bg: 'rgba(239,68,68,0.08)',  color: '#f87171', border: 'rgba(239,68,68,0.2)'  },
  read:   { bg: 'rgba(168,85,247,0.08)', color: '#c084fc', border: 'rgba(168,85,247,0.2)' },
};
const actionStyle = (a: string) =>
  ACTION_COLORS[a] ?? { bg: 'var(--accent-dim)', color: 'var(--accent)', border: 'var(--accent-border)' };

const ActionBadge = ({ action }: { action: string }) => {
  const s = actionStyle(action);
  return (
    <span className="text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full border"
      style={{ backgroundColor: s.bg, color: s.color, borderColor: s.border }}>
      {action}
    </span>
  );
};

const ResourceBadge = ({ resource }: { resource: string }) => (
  <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border"
    style={{ backgroundColor: 'var(--bg-mid)', color: 'var(--text-secondary)', borderColor: 'var(--border-strong)' }}>
    {resource}
  </span>
);

const StatusDot = ({ status }: { status: string }) => (
  <span className="flex items-center gap-1.5 text-xs"
    style={{ color: status === 'success' ? '#22c55e' : '#f87171' }}>
    <span className="w-1.5 h-1.5 rounded-full inline-block"
      style={{ backgroundColor: status === 'success' ? '#22c55e' : '#f87171' }} />
    {status}
  </span>
);

// value is ReactNode — covers strings, JSX, null, undefined
const InfoRow = ({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) => (
  <div className="flex items-start gap-3 py-2.5 border-b last:border-0"
    style={{ borderColor: 'var(--border)' }}>
    <span className="mt-0.5 shrink-0" style={{ color: 'var(--text-muted)' }}>{icon}</span>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <div className="text-xs break-all" style={{ color: 'var(--text-primary)' }}>{value}</div>
    </div>
  </div>
);

// Converts any JsonValue entirely to a string before touching JSX — no unknown leaks
const DiffBlock = ({ label, value }: { label: string; value: JsonValue | undefined }) => {
  if (value === null || value === undefined) return null;
  const display: string = typeof value === 'object'
    ? JSON.stringify(value, null, 2)
    : String(value);
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
      <div className="px-3 py-1.5 border-b text-[10px] uppercase tracking-widest font-semibold"
        style={{ backgroundColor: 'var(--bg-mid)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
        {label}
      </div>
      <pre className="p-3 text-[11px] whitespace-pre-wrap break-all leading-relaxed overflow-auto max-h-48"
        style={{ color: 'var(--text-primary)', fontFamily: 'monospace', backgroundColor: 'var(--accent-dim)' }}>
        {display}
      </pre>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AuditLogsPage() {
  const { get, set, invalidatePrefix } = useDataCache();

  const [logs, setLogs]           = useState<AuditLogEntry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [pagination, setPagination] = useState<PaginationMeta>({ total: 0, page: 1, limit: 50, totalPages: 1 });
  const [page, setPage]           = useState(1);
  const limit                      = 50;

  const [resourceFilter, setResourceFilter] = useState('');
  const [actionFilter, setActionFilter]     = useState('');
  const [fromFilter, setFrom]               = useState('');
  const [toFilter, setTo]                   = useState('');
  const [meta, setMeta] = useState<{ actions: string[]; resources: string[]; statuses: string[] }>({
    actions: [], resources: [], statuses: [],
  });

  const [detail, setDetail]               = useState<AuditLogEntry | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [noteTarget, setNoteTarget] = useState<AuditLogEntry | null>(null);
  const [noteText, setNoteText]     = useState('');
  const [noteSaving, setNoteSaving] = useState(false);

  const [flagging, setFlagging] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<AuditLogEntry | null>(null);
  const [deleting, setDeleting]         = useState(false);

  const [bulkOpen, setBulkOpen]         = useState(false);
  const [bulkResource, setBulkResource] = useState('');
  const [bulkAction, setBulkAction]     = useState('');
  const [bulkBefore, setBulkBefore]     = useState('');
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    auditLogsApi.getMeta().then(res => setMeta(res.data.data)).catch(() => {});
  }, []);

  const fetchList = useCallback((force = false) => {
    const params: Record<string, unknown> = { page, limit };
    if (resourceFilter) params.resource = resourceFilter;
    if (actionFilter)   params.action   = actionFilter;
    if (fromFilter)     params.from     = fromFilter;
    if (toFilter)       params.to       = toFilter;

    const cacheKey = 'audit-logs:' + JSON.stringify(params);
    if (!force) {
      const cached = get<{ logs: AuditLogEntry[]; pagination: PaginationMeta }>(cacheKey);
      if (cached) { setLogs(cached.logs); setPagination(cached.pagination); setLoading(false); return; }
    }
    setLoading(true);
    auditLogsApi.list(params as any)
      .then(res => {
        const d = res.data.data;
        setLogs(d.logs);
        setPagination(d.pagination);
        set(cacheKey, { logs: d.logs, pagination: d.pagination });
      })
      .finally(() => setLoading(false));
  }, [page, get, set, resourceFilter, actionFilter, fromFilter, toFilter]);

  useEffect(() => { invalidatePrefix('audit-logs:'); fetchList(true); }, [fetchList]);
  useEffect(() => { setPage(1); }, [resourceFilter, actionFilter, fromFilter, toFilter]);

  const openDetail = async (log: AuditLogEntry) => {
    setDetailLoading(true); setDetail(null);
    try {
      const res = await auditLogsApi.getOne(log._id);
      setDetail(res.data.data.log);
    } finally { setDetailLoading(false); }
  };

  const handleFlag = async (log: AuditLogEntry) => {
    setFlagging(log._id);
    try {
      await auditLogsApi.update(log._id, { flagged: !log.flagged });
      invalidatePrefix('audit-logs:'); fetchList(true);
      if (detail?._id === log._id) {
        const res = await auditLogsApi.getOne(log._id);
        setDetail(res.data.data.log);
      }
    } finally { setFlagging(null); }
  };

  const handleSaveNote = async () => {
    if (!noteTarget) return;
    setNoteSaving(true);
    try {
      await auditLogsApi.update(noteTarget._id, { note: noteText });
      setNoteTarget(null);
      invalidatePrefix('audit-logs:'); fetchList(true);
    } finally { setNoteSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await auditLogsApi.delete(deleteTarget._id);
      setDeleteTarget(null);
      invalidatePrefix('audit-logs:'); fetchList(true);
    } finally { setDeleting(false); }
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      await auditLogsApi.bulkDelete({
        ...(bulkResource ? { resource: bulkResource } : {}),
        ...(bulkAction   ? { action:   bulkAction   } : {}),
        ...(bulkBefore   ? { before:   bulkBefore   } : {}),
      });
      setBulkOpen(false);
      setBulkResource(''); setBulkAction(''); setBulkBefore('');
      invalidatePrefix('audit-logs:'); fetchList(true);
    } finally { setBulkDeleting(false); }
  };

  const inputStyle = {
    padding: '8px 12px',
    backgroundColor: 'var(--input-bg)',
    border: '1px solid var(--border-strong)',
    borderRadius: '12px',
    color: 'var(--text-primary)',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    width: '100%',
  };

  const displayName = (log: AuditLogEntry) =>
    log.adminSnapshot?.fullName ?? (log.admin ? `${log.admin.firstName} ${log.admin.lastName}` : 'System');
  const displayEmail = (log: AuditLogEntry) =>
    log.adminSnapshot?.email ?? log.admin?.email ?? '';

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl tracking-widest mb-1"
            style={{ color: 'var(--text-primary)' }}>
            AUDIT LOGS
          </h1>
          <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Full admin activity trail
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="font-display text-2xl sm:text-3xl tracking-wide" style={{ color: 'var(--accent)' }}>
              {pagination.total}
            </p>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Total</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setBulkOpen(true)}>
            <Trash2 className="w-3.5 h-3.5" />
            Bulk Delete
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-3 sm:p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { value: resourceFilter, onChange: setResourceFilter, placeholder: 'All Resources', options: meta.resources },
            { value: actionFilter,   onChange: setActionFilter,   placeholder: 'All Actions',   options: meta.actions   },
          ].map(({ value, onChange, placeholder, options }, i) => (
            <select key={i} value={value} onChange={e => onChange(e.target.value)} style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e  => e.target.style.borderColor = 'var(--border-strong)'}>
              <option value="">{placeholder}</option>
              {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}
          <input type="date" value={fromFilter} onChange={e => setFrom(e.target.value)} style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e  => e.target.style.borderColor = 'var(--border-strong)'} />
          <input type="date" value={toFilter}   onChange={e => setTo(e.target.value)}   style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e  => e.target.style.borderColor = 'var(--border-strong)'} />
        </div>
      </Card>

      {/* Table — desktop */}
      <Card className="hidden md:block">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : logs.length === 0 ? (
          <EmptyState icon={<ShieldAlert className="w-7 h-7" />} title="No Audit Logs" description="No logs match your filters." />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Admin</Th>
                  <Th>Role / Group</Th>
                  <Th>Resource</Th>
                  <Th>Action</Th>
                  <Th>Target</Th>
                  <Th>Status</Th>
                  <Th>When</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <Tr key={log._id}>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Avatar
                          firstName={log.admin?.firstName ?? log.adminSnapshot?.fullName?.split(' ')[0] ?? '?'}
                          lastName={log.admin?.lastName   ?? log.adminSnapshot?.fullName?.split(' ')[1] ?? ''}
                          size="sm"
                        />
                        <div>
                          <p className="text-xs" style={{ color: 'var(--text-primary)' }}>{displayName(log)}</p>
                          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{displayEmail(log)}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <div className="space-y-0.5">
                        {log.adminSnapshot?.roleName && (
                          <p className="text-[10px] px-1.5 py-0.5 rounded-full border inline-block"
                            style={{ color: 'var(--accent)', borderColor: 'var(--accent-border)', backgroundColor: 'var(--accent-dim)' }}>
                            {log.adminSnapshot.roleName}
                          </p>
                        )}
                        {log.adminSnapshot?.groupName && (
                          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            {log.adminSnapshot.groupName}
                          </p>
                        )}
                        {!log.adminSnapshot?.roleName && !log.adminSnapshot?.groupName && (
                          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </div>
                    </Td>
                    <Td><ResourceBadge resource={log.resource} /></Td>
                    <Td><ActionBadge action={log.action} /></Td>
                    <Td>
                      <p className="text-xs max-w-[140px] truncate" style={{ color: 'var(--text-secondary)' }}>
                        {log.targetLabel ?? log.targetId ?? '—'}
                      </p>
                    </Td>
                    <Td><StatusDot status={log.status} /></Td>
                    <Td>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {formatRelativeTime(log.createdAt)}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex gap-1 items-center">
                        {log.flagged && <Flag className="w-3 h-3 fill-current shrink-0" style={{ color: '#f97316' }} />}
                        <Button variant="ghost" size="sm" onClick={() => openDetail(log)}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm"
                          onClick={() => { setNoteTarget(log); setNoteText(log.note ?? ''); }}>
                          <StickyNote className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleFlag(log)}
                          disabled={flagging === log._id}
                          style={{ color: log.flagged ? '#f97316' : undefined }}>
                          <Flag className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(log)}
                          onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                          onMouseLeave={e => (e.currentTarget.style.color = '')}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <div className="px-4 pb-4">
              <Pagination page={pagination.page} totalPages={pagination.totalPages}
                total={pagination.total} limit={pagination.limit} onPage={setPage} />
            </div>
          </>
        )}
      </Card>

      {/* Cards — mobile */}
      <div className="flex flex-col gap-3 md:hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : logs.length === 0 ? (
          <EmptyState icon={<ShieldAlert className="w-7 h-7" />} title="No Audit Logs" description="No logs match your filters." />
        ) : (
          <>
            {logs.map(log => (
              <Card key={log._id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Avatar
                      firstName={log.admin?.firstName ?? log.adminSnapshot?.fullName?.split(' ')[0] ?? '?'}
                      lastName={log.admin?.lastName   ?? log.adminSnapshot?.fullName?.split(' ')[1] ?? ''}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{displayName(log)}</p>
                      <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{displayEmail(log)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {log.flagged && <Flag className="w-3.5 h-3.5 fill-current" style={{ color: '#f97316' }} />}
                    <ActionBadge action={log.action} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Resource</p>
                    <ResourceBadge resource={log.resource} />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Target</p>
                    <p className="truncate" style={{ color: 'var(--text-secondary)' }}>{log.targetLabel ?? log.targetId ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Role</p>
                    <p style={{ color: 'var(--text-secondary)' }}>{log.adminSnapshot?.roleName ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Status</p>
                    <StatusDot status={log.status} />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{formatRelativeTime(log.createdAt)}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openDetail(log)}><Eye className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => { setNoteTarget(log); setNoteText(log.note ?? ''); }}><StickyNote className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleFlag(log)} disabled={flagging === log._id}
                      style={{ color: log.flagged ? '#f97316' : undefined }}><Flag className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(log)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              </Card>
            ))}
            <Pagination page={pagination.page} totalPages={pagination.totalPages}
              total={pagination.total} limit={pagination.limit} onPage={setPage} />
          </>
        )}
      </div>

      {/* ── Detail Modal ─────────────────────────────────────────────────────── */}
      <Modal isOpen={!!detail || detailLoading} onClose={() => setDetail(null)} title="Audit Log Detail" size="lg">
        {detailLoading ? (
          <div className="flex justify-center py-8"><Spinner size="lg" /></div>
        ) : detail ? (
          <div className="space-y-5">

            {/* ── WHO: Admin card ── */}
            <section>
              <p className="text-[10px] uppercase tracking-widest font-semibold mb-2 flex items-center gap-1.5"
                style={{ color: 'var(--text-muted)' }}>
                <User className="w-3.5 h-3.5" /> Admin
              </p>
              <div className="rounded-xl border p-4 space-y-0"
                style={{ backgroundColor: 'var(--bg-mid)', borderColor: 'var(--border)' }}>

                {/* Avatar + name row */}
                <div className="flex items-center gap-3 pb-3 mb-1 border-b" style={{ borderColor: 'var(--border)' }}>
                  <Avatar
                    firstName={detail.admin?.firstName ?? detail.adminSnapshot?.fullName?.split(' ')[0] ?? '?'}
                    lastName={detail.admin?.lastName   ?? detail.adminSnapshot?.fullName?.split(' ')[1] ?? ''}
                    size="lg"
                  />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {displayName(detail)}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{displayEmail(detail)}</p>
                    {detail.admin?.isActive !== undefined && (
                      <span className="text-[10px] mt-0.5 inline-block"
                        style={{ color: detail.admin.isActive ? '#22c55e' : '#f87171' }}>
                        {detail.admin.isActive ? '● Active' : '● Inactive'}
                      </span>
                    )}
                  </div>
                </div>

                <InfoRow icon={<Tag className="w-3.5 h-3.5" />} label="Role at time of action"
                  value={detail.adminSnapshot?.roleName ?? <span style={{ color: 'var(--text-muted)' }}>No role</span>} />
                <InfoRow icon={<Tag className="w-3.5 h-3.5" />} label="Group at time of action"
                  value={detail.adminSnapshot?.groupName ?? <span style={{ color: 'var(--text-muted)' }}>No group</span>} />
              </div>
            </section>

            {/* ── WHAT: Action details ── */}
            <section>
              <p className="text-[10px] uppercase tracking-widest font-semibold mb-2 flex items-center gap-1.5"
                style={{ color: 'var(--text-muted)' }}>
                <Activity className="w-3.5 h-3.5" /> Action Performed
              </p>
              <div className="rounded-xl border p-4"
                style={{ backgroundColor: 'var(--bg-mid)', borderColor: 'var(--border)' }}>
                <InfoRow icon={<Activity className="w-3.5 h-3.5" />} label="Action"
                  value={<ActionBadge action={detail.action} />} />
                <InfoRow icon={<Tag className="w-3.5 h-3.5" />} label="Resource"
                  value={<ResourceBadge resource={detail.resource} />} />
                <InfoRow icon={<ArrowRight className="w-3.5 h-3.5" />} label="Target"
                  value={detail.targetLabel ?? detail.targetId ?? <span style={{ color: 'var(--text-muted)' }}>—</span>} />
                <InfoRow icon={<Activity className="w-3.5 h-3.5" />} label="Outcome"
                  value={<StatusDot status={detail.status} />} />
                {detail.errorMessage && (
                  <InfoRow icon={<ShieldAlert className="w-3.5 h-3.5" />} label="Error"
                    value={<span style={{ color: '#f87171' }}>{detail.errorMessage}</span>} />
                )}
              </div>
            </section>

            {/* ── DIFF: Before / After ── */}
            {(detail.diff?.before || detail.diff?.after) && (
              <section>
                <p className="text-[10px] uppercase tracking-widest font-semibold mb-2 flex items-center gap-1.5"
                  style={{ color: 'var(--text-muted)' }}>
                  <ArrowRight className="w-3.5 h-3.5" /> Changes
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DiffBlock label="Before" value={detail.diff.before} />
                  <DiffBlock label="After"  value={detail.diff.after}  />
                </div>
              </section>
            )}

            {/* ── WHERE/WHEN: Request context ── */}
            <section>
              <p className="text-[10px] uppercase tracking-widest font-semibold mb-2 flex items-center gap-1.5"
                style={{ color: 'var(--text-muted)' }}>
                <Globe className="w-3.5 h-3.5" /> Request Context
              </p>
              <div className="rounded-xl border p-4"
                style={{ backgroundColor: 'var(--bg-mid)', borderColor: 'var(--border)' }}>
                <InfoRow icon={<Clock className="w-3.5 h-3.5" />}   label="Timestamp"  value={formatDate(detail.createdAt)} />
                <InfoRow icon={<Globe className="w-3.5 h-3.5" />}   label="IP Address" value={
                  <span className="font-mono">{detail.ip ?? '—'}</span>
                } />
                <InfoRow icon={<Monitor className="w-3.5 h-3.5" />} label="User Agent" value={
                  <span className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {detail.userAgent ?? '—'}
                  </span>
                } />
              </div>
            </section>

            {/* ── Note ── */}
            {detail.note && (
              <div className="p-3 rounded-xl border"
                style={{ backgroundColor: 'var(--accent-dim)', borderColor: 'var(--accent-border)' }}>
                <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Note</p>
                <p className="text-xs italic" style={{ color: 'var(--text-primary)' }}>{detail.note}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" size="sm"
                onClick={() => { setNoteTarget(detail); setNoteText(detail.note ?? ''); setDetail(null); }}>
                <StickyNote className="w-3.5 h-3.5" />
                {detail.note ? 'Edit Note' : 'Add Note'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleFlag(detail)}
                disabled={flagging === detail._id}
                style={{ color: detail.flagged ? '#f97316' : undefined }}>
                <Flag className="w-3.5 h-3.5" />
                {detail.flagged ? 'Unflag' : 'Flag'}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Note Modal */}
      <Modal isOpen={!!noteTarget} onClose={() => setNoteTarget(null)} title="Add / Edit Note" size="sm">
        <div className="space-y-4">
          <Textarea label="Note" placeholder="Internal annotation..." value={noteText}
            onChange={e => setNoteText(e.target.value)} rows={4} />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setNoteTarget(null)}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={handleSaveNote} disabled={noteSaving}>
              {noteSaving ? 'Saving...' : 'Save Note'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete single */}
      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} title="Delete Audit Log"
        message="Permanently delete this log entry? This action cannot be undone." loading={deleting} />

      {/* Bulk Delete */}
      <Modal isOpen={bulkOpen} onClose={() => setBulkOpen(false)} title="Bulk Delete Logs" size="sm">
        <div className="space-y-4">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            All matching logs will be permanently deleted. At least one filter is required.
          </p>
          {[
            { value: bulkResource, onChange: setBulkResource, placeholder: 'Any Resource', options: meta.resources },
            { value: bulkAction,   onChange: setBulkAction,   placeholder: 'Any Action',   options: meta.actions   },
          ].map(({ value, onChange, placeholder, options }, i) => (
            <select key={i} value={value} onChange={e => onChange(e.target.value)} style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e  => e.target.style.borderColor = 'var(--border-strong)'}>
              <option value="">{placeholder}</option>
              {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Delete logs before</p>
            <input type="date" value={bulkBefore} onChange={e => setBulkBefore(e.target.value)} style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#f87171'}
              onBlur={e  => e.target.style.borderColor = 'var(--border-strong)'} />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setBulkOpen(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={handleBulkDelete}
              disabled={bulkDeleting || (!bulkResource && !bulkAction && !bulkBefore)}
              style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }}>
              {bulkDeleting ? 'Deleting...' : 'Delete Matching'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}