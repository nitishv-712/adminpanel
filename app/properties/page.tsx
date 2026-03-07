'use client';
import { useDataCache } from '@/lib/data-cache-context';
import { useEffect, useState, useCallback } from 'react';
import { propertiesApi } from '@/lib/api';
import { Property } from '@/types';
import {
  Card, StatusBadge, Button, Input, Select, Modal,
  ConfirmModal, EmptyState, Spinner, Pagination, Table, Th, Td, Tr,
} from '@/components/ui';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';
import {
  Home, Search, Edit2, Trash2, Eye, MapPin, Bed, Bath,
  Square, Star, ToggleLeft, ToggleRight,
} from 'lucide-react';

export default function PropertiesPage() {
  const { get, set, invalidatePrefix } = useDataCache();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const limit                        = 12;
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('');
  const [typeFilter, setType]       = useState('');

  const [editTarget, setEditTarget]     = useState<Property | null>(null);
  const [editStatus, setEditStatus]     = useState('');
  const [editFeatured, setEditFeatured] = useState(false);
  const [editBadge, setEditBadge]       = useState('');
  const [saving, setSaving]             = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);
  const [deleting, setDeleting]         = useState(false);

  const fetch = useCallback((force = false) => {
    const params: any = { page, limit };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    if (typeFilter) params.listingType = typeFilter;
    const cacheKey = 'properties:' + JSON.stringify(params);
    if (!force) {
      const cached = get<{ data: Property[]; total: number }>(cacheKey);
      if (cached) { setProperties(cached.data); setTotal(cached.total); setLoading(false); return; }
    }
    setLoading(true);
    setError('');
    propertiesApi.list(params)
      .then(res => {
        const d = res.data?.data;
        const result = { data: d?.data ?? [], total: d?.total ?? 0 };
        set(cacheKey, result);
        setProperties(result.data);
        setTotal(result.total);
      })
      .catch(err => setError(err.response?.data?.message || 'Failed to load properties'))
      .finally(() => setLoading(false));
  }, [page, search, statusFilter, typeFilter, get, set]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { setPage(1); }, [search, statusFilter, typeFilter]);

  const openEdit = (p: Property) => {
    setEditTarget(p);
    setEditStatus(p.status);
    setEditFeatured(p.isFeatured);
    setEditBadge(p.badge ?? '');
  };

  const handleSave = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      await propertiesApi.update(editTarget._id, {
        status: editStatus, isFeatured: editFeatured, badge: editBadge || null,
      });
      setEditTarget(null);
      fetch();
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await propertiesApi.delete(deleteTarget._id); setDeleteTarget(null); invalidatePrefix('properties:'); fetch(true); }
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
            PROPERTIES
          </h1>
          <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Manage all listings
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl tracking-wide" style={{ color: 'var(--accent)' }}>
            {formatNumber(total)}
          </p>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Total Listings
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              placeholder="Search properties or city..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, width: '100%', paddingLeft: '36px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-strong)'}
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatus(e.target.value)}
            style={{ ...inputStyle, padding: '8px 12px', minWidth: '130px' }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-strong)'}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="sold">Sold</option>
            <option value="rented">Rented</option>
            <option value="archived">Archived</option>
          </select>
          <select
            value={typeFilter}
            onChange={e => setType(e.target.value)}
            style={{ ...inputStyle, padding: '8px 12px', minWidth: '120px' }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-strong)'}
          >
            <option value="">All Types</option>
            <option value="sale">For Sale</option>
            <option value="rent">For Rent</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : error ? (
          <div className="flex justify-center py-16 text-sm" style={{ color: '#f87171' }}>{error}</div>
        ) : properties.length === 0 ? (
          <EmptyState icon={<Home className="w-7 h-7" />} title="No Properties" description="No listings match your filters." />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Property</Th>
                  <Th>Location</Th>
                  <Th>Price</Th>
                  <Th>Details</Th>
                  <Th>Status</Th>
                  <Th>Engagement</Th>
                  <Th>Listed</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {properties.map(p => (
                  <Tr key={p._id}>
                    <Td>
                      <div className="flex items-center gap-3 min-w-0">
                        <div style={{
                          width: '48px', height: '40px', borderRadius: '8px', flexShrink: 0,
                          backgroundColor: 'var(--accent-dim)',
                          border: '1px solid var(--accent-border)',
                          overflow: 'hidden',
                        }}>
                          {p.images?.[0] ? (
                            <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Home className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate max-w-[180px]" style={{ color: 'var(--text-primary)' }}>
                            {p.title}
                          </p>
                          {p.isFeatured && (
                            <span className="flex items-center gap-1 text-[10px]" style={{ color: '#fbbf24' }}>
                              <Star className="w-2.5 h-2.5" fill="currentColor" /> Featured
                            </span>
                          )}
                          {p.badge && (
                            <span className="text-[10px]" style={{ color: 'var(--accent)' }}>{p.badge}</span>
                          )}
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <MapPin className="w-3 h-3" />{p.address.city}
                      </div>
                    </Td>
                    <Td>
                      <span className="font-display tracking-wide text-sm" style={{ color: 'var(--accent)' }}>
                        {formatCurrency(p.price)}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <span className="flex items-center gap-1"><Bed className="w-3 h-3" />{p.bedrooms}</span>
                        <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{p.bathrooms}</span>
                        <span className="flex items-center gap-1"><Square className="w-3 h-3" />{formatNumber(p.sqft)}</span>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex flex-col gap-1">
                        <StatusBadge value={p.status} />
                        <StatusBadge value={p.listingType} />
                      </div>
                    </Td>
                    <Td>
                      <div className="text-xs space-y-0.5" style={{ color: 'var(--text-secondary)' }}>
                        <div className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatNumber(p.views)}</div>
                        <div>{p.inquiries} inquiries</div>
                      </div>
                    </Td>
                    <Td>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(p.createdAt)}</span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(p)}>
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
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Update Property">
        <div className="space-y-4">
          <Select label="Status" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="sold">Sold</option>
            <option value="rented">Rented</option>
            <option value="archived">Archived</option>
          </Select>
          <Input
            label="Badge (optional)"
            value={editBadge}
            onChange={e => setEditBadge(e.target.value)}
            placeholder="e.g. Hot Deal, New Launch"
          />
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px',
            backgroundColor: 'var(--accent-dim)',
            border: '1px solid var(--accent-border)',
            borderRadius: '12px',
          }}>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Featured Listing</span>
            <button onClick={() => setEditFeatured(!editFeatured)} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
              {editFeatured
                ? <ToggleRight className="w-6 h-6" />
                : <ToggleLeft className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
              }
            </button>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Property"
        message={`Delete "${deleteTarget?.title}"? This action cannot be undone.`}
        loading={deleting}
      />
    </div>
  );
}