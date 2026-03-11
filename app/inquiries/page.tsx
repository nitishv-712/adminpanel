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
  const [replyText, setReplyText]       = useState('');
  const [replying, setReplying]         = useState(false);
  const [editMsg, setEditMsg]           = useState<InquiryMessage | null>(null);
  const [editText, setEditText]         = useState('');
  const [editSaving, setEditSaving]     = useState(false);
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
        const d: PaginatedResponse<Inquiry> = res.data;
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
    width: '100%',
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl tracking-widest mb-1"
            style={{ color: 'var(--text-primary)' }}>
            INQUIRIES
          </h1>
          <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            All buyer–seller conversations
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-display text-2xl sm:text-3xl tracking-wide" style={{ color: 'var(--accent)' }}>{total}</p>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Total</p>
        </div>
      </div>

      {/* Filter */}
      <Card className="p-3 sm:p-4">
        <select
          value={statusFilter} onChange={e => setStatus(e.target.value)}
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border-strong)'}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
        </select>
      </Card>

      {/* Table — desktop */}
      <Card className="hidden md:block">
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
                          : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>}
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

      {/* Cards — mobile */}
      <div className="flex flex-col gap-3 md:hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : inquiries.length === 0 ? (
          <EmptyState icon={<MessageSquare className="w-7 h-7" />} title="No Inquiries" description="No inquiries match your filter." />
        ) : (
          <>
            {inquiries.map(inq => {
              const prop  = asProp(inq.property as any);
              const user  = asUser(inq.user as any);
              const owner = asUser(inq.owner as any);
              return (
                <Card key={inq._id} className="p-4 space-y-3">
                  {/* Property */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {prop?.title ?? (typeof inq.property === 'string' ? inq.property : '—')}
                      </p>
                      {prop?.address?.city && (
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{prop.address.city}</p>
                      )}
                    </div>
                    <StatusBadge value={inq.status} />
                  </div>

                  {/* Buyer + Owner */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Buyer</p>
                      {user
                        ? <div className="flex items-center gap-1.5">
                            <Avatar firstName={user.firstName} lastName={user.lastName} size="sm" />
                            <span className="truncate" style={{ color: 'var(--text-primary)' }}>{user.firstName} {user.lastName}</span>
                          </div>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>
                      }
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Owner</p>
                      {owner
                        ? <span style={{ color: 'var(--text-secondary)' }}>{owner.firstName} {owner.lastName}</span>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>
                      }
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{formatRelativeTime(inq.lastMessageAt)}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openDetail(inq)}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => { setStatusTarget(inq); setNewStatus(inq.status); }}>
                        Status
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

      {/* Detail Modal */}
      <Modal isOpen={!!detail || detailLoading} onClose={() => setDetail(null)} title="Inquiry Thread" size="lg">
        {detailLoading ? (
          <div className="flex justify-center py-8"><Spinner size="lg" /></div>
        ) : detail ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {[
                { label: 'Status', content: <StatusBadge value={detail.inquiry.status} /> },
                { label: 'Opened', content: <p className="text-xs" style={{ color: 'var(--text-primary)' }}>{formatDate(detail.inquiry.createdAt)}</p> },
              ].map(({ label, content }) => (
                <div key={label} className="p-2 sm:p-3 rounded-xl border"
                  style={{ backgroundColor: 'var(--accent-dim)', borderColor: 'var(--border)' }}>
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
                  {content}
                </div>
              ))}
            </div>

            <div className="space-y-2 max-h-56 sm:max-h-72 overflow-y-auto pr-1">
              {detail.messages.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>No messages yet.</p>
              ) : detail.messages.map(msg => {
                const sender  = asUser(msg.sender as any);
                const isAdmin = msg.role === 'admin';
                return (
                  <div key={msg._id} className="p-3 rounded-xl text-xs"
                    style={{
                      backgroundColor: isAdmin ? 'var(--accent-dim)' : 'var(--bg-mid)',
                      border: `1px solid ${isAdmin ? 'var(--accent-border)' : 'var(--border)'}`,
                    }}>
                    <div className="flex items-start justify-between gap-2 mb-1.5 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {sender && <Avatar firstName={sender.firstName} lastName={sender.lastName} size="sm" />}
                        <span className="font-medium capitalize" style={{ color: 'var(--text-secondary)' }}>
                          {sender ? `${sender.firstName} ${sender.lastName}` : '—'}
                          <span className="ml-1.5 opacity-60">({msg.role})</span>
                        </span>
                        {msg.isEditedByAdmin && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full border"
                            style={{ color: '#fbbf24', borderColor: 'rgba(251,191,36,0.2)' }}>edited</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button title="Toggle user visibility" onClick={() => handleToggleVisibility(msg, 'visibleToUser')}
                          className="p-1 rounded-lg transition-colors"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: msg.visibleToUser ? 'var(--accent)' : 'var(--text-muted)' }}>
                          <EyeOff className="w-3 h-3" />
                        </button>
                        <button title="Edit" onClick={() => { setEditMsg(msg); setEditText(msg.text); }}
                          className="p-1 rounded-lg"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button title="Delete" onClick={() => setDeleteMsgTarget(msg)}
                          className="p-1 rounded-lg"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <span className="ml-1" style={{ color: 'var(--text-muted)' }}>{formatRelativeTime(msg.createdAt)}</span>
                      </div>
                    </div>
                    <p className="leading-relaxed" style={{ color: 'var(--text-primary)' }}>{msg.text}</p>
                    <div className="mt-1.5 flex gap-2 flex-wrap" style={{ fontSize: '10px' }}>
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

            <div className="pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <Textarea label="Admin Reply" placeholder="Type your message..." value={replyText}
                onChange={e => setReplyText(e.target.value)} rows={3} />
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

      <ConfirmModal isOpen={!!deleteMsgTarget} onClose={() => setDeleteMsgTarget(null)}
        onConfirm={handleDeleteMsg} title="Delete Message"
        message="Delete this message permanently? This cannot be undone." loading={deletingMsg} />
    </div>
  );
}