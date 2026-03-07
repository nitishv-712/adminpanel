'use client';
import { useDataCache } from '@/lib/data-cache-context';
import { useEffect, useState, useCallback } from 'react';
import { inquiriesApi } from '@/lib/api';
import { Inquiry, InquiryMessage, PaginatedResponse, User, Property } from '@/types';
import {
  Card, StatusBadge, Button, Select, Modal, ConfirmModal,
  EmptyState, Spinner, Pagination, Table, Th, Td, Tr, Avatar, Textarea,
} from '@/components/ui';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { MessageSquare, Eye, Send, Trash2, EyeOff, Edit2 } from 'lucide-react';

const asUser = (v: User | string | undefined): User | null =>
  v && typeof v === 'object' ? v as User : null;
const asProp = (v: Property | string | undefined): Property | null =>
  v && typeof v === 'object' ? v as Property : null;

export default function InquiriesPage() {
  const { get, set, invalidatePrefix } = useDataCache();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const limit                      = 15;
  const [statusFilter, setStatus] = useState('');

  const [detail, setDetail]            = useState<{ inquiry: Inquiry; messages: InquiryMessage[] } | null>(null);
  const [detailLoading, setDetailLoad] = useState(false);

  const [statusTarget, setStatusTarget] = useState<Inquiry | null>(null);
  const [newStatus, setNewStatus]       = useState('');
  const [saving, setSaving]             = useState(false);

  const [replyText, setReplyText] = useState('');
  const [replying, setReplying]   = useState(false);

  const [editMsg, setEditMsg]       = useState<InquiryMessage | null>(null);
  const [editText, setEditText]     = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const [deleteMsgTarget, setDeleteMsgTarget] = useState<InquiryMessage | null>(null);
  const [deletingMsg, setDeletingMsg]         = useState(false);

  const fetchList = useCallback((force = false) => {
    const params: Record<string, unknown> = { page, limit };
    if (statusFilter) params.status = statusFilter;
    const cacheKey = 'inquiries:' + JSON.stringify(params);
    if (!force) {
      const cached = get<{ data: Inquiry[]; total: number }>(cacheKey);
      if (cached) { setInquiries(cached.data); setTotal(cached.total); setLoading(false); return; }
    }
    setLoading(true);
    inquiriesApi.list(params)
      .then(res => {
        const d: PaginatedResponse<Inquiry> = res.data.data;
        setInquiries(d.data); setTotal(d.pagination.pages);
        set(cacheKey, { data: d.data, total: d.pagination.pages });
      })
      .finally(() => setLoading(false));
  }, [page, get, set, statusFilter]);

  useEffect(() => { invalidatePrefix('inquiries:'); fetchList(true); }, [fetchList]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  const openDetail = async (inq: Inquiry) => {
    setDetailLoad(true); setDetail(null); setReplyText('');
    try {
      const res = await inquiriesApi.getOne(inq._id);
      setDetail(res.data.data);
    } finally { setDetailLoad(false); }
  };

  const handleSendReply = async () => {
    if (!detail || !replyText.trim()) return;
    setReplying(true);
    try {
      await inquiriesApi.sendMessage(detail.inquiry._id, replyText.trim());
      setReplyText('');
      const res = await inquiriesApi.getOne(detail.inquiry._id);
      setDetail(res.data.data);
    } finally { setReplying(false); }
  };

  const handleUpdateStatus = async () => {
    if (!statusTarget) return;
    setSaving(true);
    try {
      await inquiriesApi.updateStatus(statusTarget._id, newStatus);
      setStatusTarget(null);
      invalidatePrefix('inquiries:'); fetchList(true);
      if (detail?.inquiry._id === statusTarget._id) {
        const res = await inquiriesApi.getOne(statusTarget._id);
        setDetail(res.data.data);
      }
    } finally { setSaving(false); }
  };

  const handleToggleVisibility = async (msg: InquiryMessage, field: 'visibleToUser' | 'visibleToOwner') => {
    await inquiriesApi.hideMessage(msg._id, { [field]: !msg[field] });
    if (detail) {
      const res = await inquiriesApi.getOne(detail.inquiry._id);
      setDetail(res.data.data);
    }
  };

  const handleEditMsg = async () => {
    if (!editMsg || !editText.trim()) return;
    setEditSaving(true);
    try {
      await inquiriesApi.editMessage(editMsg._id, editText.trim());
      setEditMsg(null);
      if (detail) {
        const res = await inquiriesApi.getOne(detail.inquiry._id);
        setDetail(res.data.data);
      }
    } finally { setEditSaving(false); }
  };

  const handleDeleteMsg = async () => {
    if (!deleteMsgTarget) return;
    setDeletingMsg(true);
    try {
      await inquiriesApi.deleteMessage(deleteMsgTarget._id);
      setDeleteMsgTarget(null);
      if (detail) {
        const res = await inquiriesApi.getOne(detail.inquiry._id);
        setDetail(res.data.data);
      }
    } finally { setDeletingMsg(false); }
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
            INQUIRIES
          </h1>
          <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            All buyer–seller conversations
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl tracking-wide" style={{ color: 'var(--accent)' }}>{total}</p>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Total</p>
        </div>
      </div>

      {/* Filter */}
      <Card className="p-4">
        <select
          value={statusFilter} onChange={e => setStatus(e.target.value)}
          style={{ ...inputStyle, minWidth: '160px' }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border-strong)'}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
        </select>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : inquiries.length === 0 ? (
          <EmptyState icon={<MessageSquare className="w-7 h-7" />} title="No Inquiries" description="No inquiries match your filter." />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Property</Th>
                  <Th>Buyer</Th>
                  <Th>Owner</Th>
                  <Th>Status</Th>
                  <Th>Last Message</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {inquiries.map(inq => {
                  const prop  = asProp(inq.property as any);
                  const user  = asUser(inq.user as any);
                  const owner = asUser(inq.owner as any);
                  return (
                    <Tr key={inq._id}>
                      <Td>
                        <p className="text-xs max-w-[160px] truncate" style={{ color: 'var(--text-primary)' }}>
                          {prop?.title ?? (typeof inq.property === 'string' ? inq.property : '—')}
                        </p>
                        {prop && <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{prop.address?.city}</p>}
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
                      <Td>
                        {owner
                          ? <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{owner.firstName} {owner.lastName}</p>
                          : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                        }
                      </Td>
                      <Td><StatusBadge value={inq.status} /></Td>
                      <Td><span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatRelativeTime(inq.lastMessageAt)}</span></Td>
                      <Td>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openDetail(inq)}>
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => { setStatusTarget(inq); setNewStatus(inq.status); }}>
                            Status
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

      {/* Detail / Thread Modal */}
      <Modal isOpen={!!detail || detailLoading} onClose={() => setDetail(null)} title="Inquiry Thread" size="lg">
        {detailLoading ? (
          <div className="flex justify-center py-8"><Spinner size="lg" /></div>
        ) : detail ? (
          <div className="space-y-4">
            {/* Meta */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Status', content: <StatusBadge value={detail.inquiry.status} /> },
                { label: 'Opened',  content: <p className="text-xs" style={{ color: 'var(--text-primary)' }}>{formatDate(detail.inquiry.createdAt)}</p> },
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

            {/* Messages */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {detail.messages.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>No messages yet.</p>
              ) : detail.messages.map(msg => {
                const sender  = asUser(msg.sender as any);
                const isAdmin = msg.role === 'admin';
                return (
                  <div key={msg._id} style={{
                    padding: '12px', borderRadius: '12px', fontSize: '12px',
                    backgroundColor: isAdmin ? 'var(--accent-dim)' : 'var(--bg-mid)',
                    border: `1px solid ${isAdmin ? 'var(--accent-border)' : 'var(--border)'}`,
                  }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        {sender && <Avatar firstName={sender.firstName} lastName={sender.lastName} size="sm" />}
                        <span className="font-medium capitalize" style={{ color: 'var(--text-secondary)' }}>
                          {sender ? `${sender.firstName} ${sender.lastName}` : '—'}
                          <span className="ml-1.5 opacity-60">({msg.role})</span>
                        </span>
                        {msg.isEditedByAdmin && (
                          <span style={{
                            fontSize: '10px', color: '#fbbf24',
                            border: '1px solid rgba(251,191,36,0.2)',
                            padding: '2px 6px', borderRadius: '999px',
                          }}>edited</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          title={`${msg.visibleToUser ? 'Hide from' : 'Show to'} user`}
                          onClick={() => handleToggleVisibility(msg, 'visibleToUser')}
                          style={{
                            padding: '4px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer',
                            color: msg.visibleToUser ? 'var(--accent)' : 'var(--text-muted)',
                            transition: 'color 0.15s',
                          }}
                        >
                          <EyeOff className="w-3 h-3" />
                        </button>
                        <button
                          title="Edit message"
                          onClick={() => { setEditMsg(msg); setEditText(msg.text); }}
                          style={{
                            padding: '4px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--text-muted)', transition: 'color 0.15s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          title="Delete message"
                          onClick={() => setDeleteMsgTarget(msg)}
                          style={{
                            padding: '4px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--text-muted)', transition: 'color 0.15s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <span className="ml-1" style={{ color: 'var(--text-muted)' }}>{formatRelativeTime(msg.createdAt)}</span>
                      </div>
                    </div>
                    <p className="leading-relaxed" style={{ color: 'var(--text-primary)' }}>{msg.text}</p>
                    <div className="mt-1.5 flex gap-2" style={{ fontSize: '10px' }}>
                      <span style={{ color: msg.visibleToUser ? 'var(--accent)' : 'var(--text-muted)' }}>
                        {msg.visibleToUser ? '✓' : '✗'} Visible to buyer
                      </span>
                      <span style={{ color: msg.visibleToOwner ? 'var(--accent)' : 'var(--text-muted)' }}>
                        {msg.visibleToOwner ? '✓' : '✗'} Visible to owner
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply box */}
            <div className="pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <Textarea
                label="Admin Reply"
                placeholder="Type your message..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <Button variant="primary" size="sm" onClick={handleSendReply} disabled={replying || !replyText.trim()}>
                  <Send className="w-3.5 h-3.5" />
                  {replying ? 'Sending...' : 'Send Message'}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Status Modal */}
      <Modal isOpen={!!statusTarget} onClose={() => setStatusTarget(null)} title="Update Status" size="sm">
        <div className="space-y-4">
          <Select label="Status" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
            <option value="active">Active</option>
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

      {/* Edit Message Modal */}
      <Modal isOpen={!!editMsg} onClose={() => setEditMsg(null)} title="Edit Message" size="sm">
        <div className="space-y-4">
          <Textarea label="Message" value={editText} onChange={e => setEditText(e.target.value)} rows={4} />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setEditMsg(null)}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={handleEditMsg} disabled={editSaving}>
              {editSaving ? 'Saving...' : 'Save Edit'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Message Confirm */}
      <ConfirmModal
        isOpen={!!deleteMsgTarget}
        onClose={() => setDeleteMsgTarget(null)}
        onConfirm={handleDeleteMsg}
        title="Delete Message"
        message="Delete this message permanently? This cannot be undone."
        loading={deletingMsg}
      />
    </div>
  );
}