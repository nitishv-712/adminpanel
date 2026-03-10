'use client';
import { useDataCache } from '@/lib/data-cache-context';
import { useEffect, useState, useCallback } from 'react';
import { supportApi } from '@/lib/api';
import { SupportTicket, TicketMessage, SupportStats, PaginatedResponse, User } from '@/types';
import {
  Card, StatusBadge, Button, Select, Modal, ConfirmModal,
  EmptyState, Spinner, Pagination, Table, Th, Td, Tr, Avatar, Textarea, StatCard,
} from '@/components/ui';
import { formatDate, formatRelativeTime, formatNumber } from '@/lib/utils';
import {
  Headphones, Eye, Trash2, Send, ChevronDown,
  AlertTriangle, CheckCircle, Clock, XCircle, MessageSquare,
} from 'lucide-react';

const asUser = (v: User | string | undefined | null): User | null =>
  v && typeof v === 'object' ? v as User : null;

export default function SupportTicketsPage() {
  const { get, set, invalidatePrefix } = useDataCache();
  const [tickets, setTickets]     = useState<SupportTicket[]>([]);
  const [loading, setLoading]     = useState(true);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const limit                      = 15;
  const [statusFilter, setStatus] = useState('');
  const [catFilter, setCat]       = useState('');
  const [priFilter, setPri]       = useState('');

  const [stats, setStats] = useState<SupportStats | null>(null);

  const [detail, setDetail]            = useState<{ ticket: SupportTicket; messages: TicketMessage[] } | null>(null);
  const [detailLoading, setDetailLoad] = useState(false);

  const [replyText, setReplyText] = useState('');
  const [replying, setReplying]   = useState(false);

  const [statusTarget, setStatusTarget] = useState<SupportTicket | null>(null);
  const [newStatus, setNewStatus]       = useState('');
  const [saving, setSaving]             = useState(false);

  const [priTarget, setPriTarget] = useState<SupportTicket | null>(null);
  const [newPri, setNewPri]       = useState('');
  const [priSaving, setPriSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<SupportTicket | null>(null);
  const [deleting, setDeleting]         = useState(false);

  const fetchList = useCallback((force = false) => {
    const params: Record<string, unknown> = { page, limit };
    if (statusFilter) params.status   = statusFilter;
    if (catFilter)    params.category = catFilter;
    if (priFilter)    params.priority = priFilter;
    const cacheKey = 'support:' + JSON.stringify(params);
    if (!force) {
      const cached = get<{ data: SupportTicket[]; total: number }>(cacheKey);
      if (cached) { setTickets(cached.data); setTotal(cached.total); setLoading(false); return; }
    }
    setLoading(true);
    supportApi.list(params)
      .then(res => {
        const d: PaginatedResponse<SupportTicket> = res.data;
        setTickets(d.data); setTotal(d.pagination.pages);
        set(cacheKey, { data: d.data, total: d.pagination.pages });
      })
      .finally(() => setLoading(false));
  }, [page, get, set, statusFilter, catFilter, priFilter]);

  useEffect(() => { invalidatePrefix('support:'); fetchList(true); }, [fetchList]);
  useEffect(() => { setPage(1); }, [statusFilter, catFilter, priFilter]);

  useEffect(() => {
    supportApi.stats().then(res => setStats(res.data.data)).catch(() => {});
  }, []);

  const openDetail = async (t: SupportTicket) => {
    setDetailLoad(true); setDetail(null); setReplyText('');
    try {
      const res = await supportApi.getOne(t._id);
      setDetail(res.data.data);
    } finally { setDetailLoad(false); }
  };

  const handleReply = async () => {
    if (!detail || !replyText.trim()) return;
    setReplying(true);
    try {
      await supportApi.sendMessage(detail.ticket._id, replyText.trim());
      setReplyText('');
      const res = await supportApi.getOne(detail.ticket._id);
      setDetail(res.data.data);
      invalidatePrefix('support:'); fetchList(true);
    } finally { setReplying(false); }
  };

  const handleUpdateStatus = async () => {
    if (!statusTarget) return;
    setSaving(true);
    try {
      await supportApi.updateStatus(statusTarget._id, newStatus);
      setStatusTarget(null);
      invalidatePrefix('support:'); fetchList(true);
      if (detail?.ticket._id === statusTarget._id) {
        const res = await supportApi.getOne(statusTarget._id);
        setDetail(res.data.data);
      }
    } finally { setSaving(false); }
  };

  const handleUpdatePriority = async () => {
    if (!priTarget) return;
    setPriSaving(true);
    try {
      await supportApi.updatePriority(priTarget._id, newPri);
      setPriTarget(null);
      invalidatePrefix('support:'); fetchList(true);
    } finally { setPriSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await supportApi.delete(deleteTarget._id);
      setDeleteTarget(null);
      if (detail?.ticket._id === deleteTarget._id) setDetail(null);
      invalidatePrefix('support:'); fetchList(true);
    } finally { setDeleting(false); }
  };

  const totalPages = Math.ceil(total / limit);

  const inputStyle = {
    padding: '8px 12px',
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
            SUPPORT TICKETS
          </h1>
          <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Customer support management
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl tracking-wide" style={{ color: 'var(--accent)' }}>{formatNumber(total)}</p>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Total Tickets</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Open"          value={stats.openTickets}         icon={<AlertTriangle className="w-4 h-4" />} accent />
          <StatCard label="In Progress"   value={stats.inProgressTickets}   icon={<Clock className="w-4 h-4" />} />
          <StatCard label="Resolved"      value={stats.resolvedTickets}     icon={<CheckCircle className="w-4 h-4" />} accent />
          <StatCard label="High Priority" value={stats.highPriorityTickets} icon={<XCircle className="w-4 h-4" />} />
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          {[
            {
              value: statusFilter, onChange: (v: string) => setStatus(v), minWidth: '140px',
              options: [
                { value: '', label: 'All Status' },
                { value: 'open', label: 'Open' },
                { value: 'in-progress', label: 'In Progress' },
                { value: 'resolved', label: 'Resolved' },
                { value: 'closed', label: 'Closed' },
              ],
            },
            {
              value: catFilter, onChange: (v: string) => setCat(v), minWidth: '140px',
              options: [
                { value: '', label: 'All Categories' },
                { value: 'technical', label: 'Technical' },
                { value: 'billing', label: 'Billing' },
                { value: 'account', label: 'Account' },
                { value: 'listing', label: 'Listing' },
                { value: 'other', label: 'Other' },
              ],
            },
            {
              value: priFilter, onChange: (v: string) => setPri(v), minWidth: '130px',
              options: [
                { value: '', label: 'All Priority' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ],
            },
          ].map((sel, i) => (
            <select
              key={i}
              value={sel.value}
              onChange={e => sel.onChange(e.target.value)}
              style={{ ...inputStyle, minWidth: sel.minWidth }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-strong)'}
            >
              {sel.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ))}
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : tickets.length === 0 ? (
          <EmptyState icon={<Headphones className="w-7 h-7" />} title="No Tickets" description="No support tickets match your filters." />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Subject</Th>
                  <Th>User</Th>
                  <Th>Category</Th>
                  <Th>Priority</Th>
                  <Th>Status</Th>
                  <Th>Messages</Th>
                  <Th>Last Activity</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => {
                  const user = asUser(t.user);
                  return (
                    <Tr key={t._id}>
                      <Td>
                        <p className="text-sm truncate max-w-[200px]" style={{ color: 'var(--text-primary)' }}>{t.subject}</p>
                      </Td>
                      <Td>
                        {user ? (
                          <div className="flex items-center gap-2">
                            <Avatar firstName={user.firstName} lastName={user.lastName} size="sm" />
                            <div>
                              <p className="text-xs" style={{ color: 'var(--text-primary)' }}>{user.firstName} {user.lastName}</p>
                              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
                            </div>
                          </div>
                        ) : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>}
                      </Td>
                      <Td><StatusBadge value={t.category} /></Td>
                      <Td><StatusBadge value={t.priority} /></Td>
                      <Td><StatusBadge value={t.status} /></Td>
                      <Td>
                        <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <MessageSquare className="w-3 h-3" />{t.messageCount}
                        </div>
                      </Td>
                      <Td><span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatRelativeTime(t.lastMessageAt)}</span></Td>
                      <Td>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openDetail(t)}>
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => { setStatusTarget(t); setNewStatus(t.status); }}>
                            Status
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { setPriTarget(t); setNewPri(t.priority); }}>
                            <ChevronDown className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(t)}>
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

      {/* Detail Modal */}
      <Modal isOpen={!!detail || detailLoading} onClose={() => setDetail(null)} title="Ticket Detail" size="lg">
        {detailLoading ? (
          <div className="flex justify-center py-8"><Spinner size="lg" /></div>
        ) : detail ? (
          <div className="space-y-4">
            {/* Meta */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Status',   content: <StatusBadge value={detail.ticket.status} /> },
                { label: 'Priority', content: <StatusBadge value={detail.ticket.priority} /> },
                { label: 'Category', content: <StatusBadge value={detail.ticket.category} /> },
              ].map(({ label, content }) => (
                <div key={label} style={{
                  padding: '12px',
                  backgroundColor: 'var(--accent-dim)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                }}>
                  <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
                  {content}
                </div>
              ))}
            </div>

            <div style={{
              padding: '12px',
              backgroundColor: 'var(--accent-dim)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
            }}>
              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Subject</p>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{detail.ticket.subject}</p>
            </div>

            {/* Messages */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {detail.messages.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>No messages yet.</p>
              ) : detail.messages.map(msg => (
                <div key={msg._id} style={{
                  padding: '12px', borderRadius: '12px', fontSize: '12px',
                  backgroundColor: msg.isAdmin ? 'var(--accent-dim)' : 'var(--bg-mid)',
                  border: `1px solid ${msg.isAdmin ? 'var(--accent-border)' : 'var(--border)'}`,
                }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {msg.isAdmin ? '🛡 Admin' : (() => {
                        const s = asUser(msg.sender as any);
                        return s ? `${s.firstName} ${s.lastName}` : 'User';
                      })()}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>{formatRelativeTime(msg.createdAt)}</span>
                  </div>
                  <p className="leading-relaxed" style={{ color: 'var(--text-primary)' }}>{msg.text}</p>
                </div>
              ))}
            </div>

            {/* Reply — only if not closed */}
            {detail.ticket.status !== 'closed' && (
              <div className="pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                <Textarea
                  label="Admin Reply"
                  placeholder="Type your reply..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end mt-2">
                  <Button variant="primary" size="sm" onClick={handleReply} disabled={replying || !replyText.trim()}>
                    <Send className="w-3.5 h-3.5" />
                    {replying ? 'Sending...' : 'Send Reply'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Status Modal */}
      <Modal isOpen={!!statusTarget} onClose={() => setStatusTarget(null)} title="Update Status" size="sm">
        <div className="space-y-4">
          <Select label="Status" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </Select>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStatusTarget(null)}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={handleUpdateStatus} disabled={saving}>
              {saving ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Priority Modal */}
      <Modal isOpen={!!priTarget} onClose={() => setPriTarget(null)} title="Update Priority" size="sm">
        <div className="space-y-4">
          <Select label="Priority" value={newPri} onChange={e => setNewPri(e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </Select>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setPriTarget(null)}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={handleUpdatePriority} disabled={priSaving}>
              {priSaving ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Ticket"
        message={`Delete ticket "${deleteTarget?.subject}"? All messages will be removed permanently.`}
        loading={deleting}
      />
    </div>
  );
}