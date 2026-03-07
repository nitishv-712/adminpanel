'use client';
import { useDataCache } from '@/lib/data-cache-context';
import { useEffect, useState, useCallback } from 'react';
import { reviewsApi } from '@/lib/api';
import { Review, PaginatedResponse, ApiUser, ApiProperty } from '@/types';
import {
  Card, StatusBadge, Button, Select, Modal, ConfirmModal,
  EmptyState, Spinner, Pagination, Table, Th, Td, Tr, Avatar,
} from '@/components/ui';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { Star, Trash2, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';

const asUser     = (v: string | ApiUser): ApiUser | null =>
  typeof v === 'object' && v !== null ? v : null;
const asProperty = (v: string | ApiProperty): ApiProperty | null =>
  typeof v === 'object' && v !== null ? v : null;

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star
        key={i}
        className="w-3 h-3"
        fill={i <= rating ? '#fbbf24' : 'transparent'}
        color={i <= rating ? '#fbbf24' : 'var(--text-muted)'}
      />
    ))}
    <span className="text-xs ml-1" style={{ color: 'var(--text-secondary)' }}>{rating}/5</span>
  </div>
);

export default function ReviewsPage() {
  const { get, set, invalidatePrefix } = useDataCache();
  const [reviews, setReviews]     = useState<Review[]>([]);
  const [loading, setLoading]     = useState(true);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const limit                      = 15;
  const [statusFilter, setStatus] = useState('');
  const [ratingFilter, setRating] = useState('');

  const [detail, setDetail]             = useState<Review | null>(null);
  const [statusTarget, setStatusTarget] = useState<Review | null>(null);
  const [newStatus, setNewStatus]       = useState('');
  const [saving, setSaving]             = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);
  const [deleting, setDeleting]         = useState(false);

  const fetchList = useCallback((force = false) => {
    const params: Record<string, unknown> = { page, limit };
    if (statusFilter) params.status = statusFilter;
    if (ratingFilter) params.rating = ratingFilter;
    const cacheKey = 'reviews:' + JSON.stringify(params);
    if (!force) {
      const cached = get<{ data: Review[]; total: number }>(cacheKey);
      if (cached) { setReviews(cached.data); setTotal(cached.total); setLoading(false); return; }
    }
    setLoading(true);
    reviewsApi.list(params)
      .then(res => {
        const d: PaginatedResponse<Review> = res.data.data;
        setReviews(d.data); setTotal(d.pagination.total);
        set(cacheKey, { data: d.data, total: d.pagination.total });
      })
      .finally(() => setLoading(false));
  }, [page, get, set, statusFilter, ratingFilter]);

  useEffect(() => { fetchList(); }, [fetchList]);
  useEffect(() => { setPage(1); }, [statusFilter, ratingFilter]);

  const handleUpdateStatus = async () => {
    if (!statusTarget) return;
    setSaving(true);
    try {
      await reviewsApi.updateStatus(statusTarget._id, newStatus);
      setStatusTarget(null); invalidatePrefix('reviews:'); fetchList(true);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await reviewsApi.delete(deleteTarget._id);
      setDeleteTarget(null); invalidatePrefix('reviews:'); fetchList(true);
    } finally { setDeleting(false); }
  };

  const totalPages = Math.ceil(total / limit);
  const published  = reviews.filter(r => r.status === 'published').length;
  const pending    = reviews.filter(r => r.status === 'pending').length;
  const rejected   = reviews.filter(r => r.status === 'rejected').length;

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
            REVIEWS
          </h1>
          <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Property reviews moderation
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl tracking-wide" style={{ color: 'var(--accent)' }}>{total}</p>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Total Reviews</p>
        </div>
      </div>

      {/* Quick counts */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
            backgroundColor: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CheckCircle className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p className="font-display text-xl" style={{ color: 'var(--accent)' }}>{published}</p>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Published</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
            backgroundColor: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Clock className="w-4 h-4" style={{ color: '#fbbf24' }} />
          </div>
          <div>
            <p className="font-display text-xl" style={{ color: '#fbbf24' }}>{pending}</p>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Pending</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
            backgroundColor: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <XCircle className="w-4 h-4" style={{ color: '#f87171' }} />
          </div>
          <div>
            <p className="font-display text-xl" style={{ color: '#f87171' }}>{rejected}</p>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Rejected</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <select
            value={statusFilter} onChange={e => setStatus(e.target.value)}
            style={{ ...inputStyle, minWidth: '150px' }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-strong)'}
          >
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={ratingFilter} onChange={e => setRating(e.target.value)}
            style={{ ...inputStyle, minWidth: '130px' }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-strong)'}
          >
            <option value="">All Ratings</option>
            {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Stars</option>)}
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : reviews.length === 0 ? (
          <EmptyState icon={<Star className="w-7 h-7" />} title="No Reviews" description="No reviews match your filters." />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Reviewer</Th>
                  <Th>Property</Th>
                  <Th>Rating</Th>
                  <Th>Title</Th>
                  <Th>Status</Th>
                  <Th>Date</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {reviews.map(r => {
                  const user     = asUser(r.user);
                  const property = asProperty(r.property);
                  return (
                    <Tr key={r._id}>
                      <Td>
                        <div className="flex items-center gap-2">
                          <Avatar firstName={user?.firstName} lastName={user?.lastName} size="sm" />
                          <div>
                            <p className="text-xs" style={{ color: 'var(--text-primary)' }}>{user?.firstName} {user?.lastName}</p>
                            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <p className="text-xs truncate max-w-[150px]" style={{ color: 'var(--text-secondary)' }}>
                          {property?.title ?? r.property as string}
                        </p>
                      </Td>
                      <Td><StarRating rating={r.rating} /></Td>
                      <Td>
                        <p className="text-xs truncate max-w-[160px]" style={{ color: 'var(--text-primary)' }}>{r.title}</p>
                      </Td>
                      <Td><StatusBadge value={r.status} /></Td>
                      <Td><span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatRelativeTime(r.createdAt)}</span></Td>
                      <Td>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setDetail(r)}>
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => { setStatusTarget(r); setNewStatus(r.status); }}>
                            Status
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(r)}>
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
      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title="Review Detail" size="md">
        {detail && (() => {
          const u = asUser(detail.user);
          return (
            <div className="space-y-4">
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                backgroundColor: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: '12px',
              }}>
                <Avatar firstName={u?.firstName} lastName={u?.lastName} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{u?.firstName} {u?.lastName}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{u?.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div style={{ padding: '12px', backgroundColor: 'var(--accent-dim)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                  <p className="text-[10px] uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Rating</p>
                  <StarRating rating={detail.rating} />
                </div>
                <div style={{ padding: '12px', backgroundColor: 'var(--accent-dim)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                  <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Status</p>
                  <StatusBadge value={detail.status} />
                </div>
              </div>
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-mid)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>{detail.title}</p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{detail.comment}</p>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Posted {formatDate(detail.createdAt)}</p>
              <div className="flex gap-2 pt-1">
                {detail.status !== 'published' && (
                  <Button variant="secondary" size="sm" onClick={async () => {
                    await reviewsApi.updateStatus(detail._id, 'published');
                    setDetail(null); invalidatePrefix('reviews:'); fetchList(true);
                  }}>
                    <CheckCircle className="w-3.5 h-3.5" /> Publish
                  </Button>
                )}
                {detail.status !== 'rejected' && (
                  <Button variant="danger" size="sm" onClick={async () => {
                    await reviewsApi.updateStatus(detail._id, 'rejected');
                    setDetail(null); invalidatePrefix('reviews:'); fetchList(true);
                  }}>
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </Button>
                )}
                {detail.status !== 'pending' && (
                  <Button variant="outline" size="sm" onClick={async () => {
                    await reviewsApi.updateStatus(detail._id, 'pending');
                    setDetail(null); invalidatePrefix('reviews:'); fetchList(true);
                  }}>
                    Set Pending
                  </Button>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Status Modal */}
      <Modal isOpen={!!statusTarget} onClose={() => setStatusTarget(null)} title="Update Status" size="sm">
        <div className="space-y-4">
          <Select label="Status" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
            <option value="published">Published</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </Select>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStatusTarget(null)}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={handleUpdateStatus} disabled={saving}>
              {saving ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Review"
        message={`Delete "${deleteTarget?.title}"? This will also recalculate the property's average rating.`}
        loading={deleting}
      />
    </div>
  );
}