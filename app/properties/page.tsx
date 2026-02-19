'use client';
import { useEffect, useState, useCallback } from 'react';
import { propertiesApi } from '@/lib/api';
import { Property } from '@/types';
import {
  PageHeader, StatusBadge, Pagination,
  ConfirmModal, FilterSelect, SearchInput, Spinner, EmptyState
} from '@/components/ui';
import { Trash2, Star, CheckCircle, XCircle, Home, Eye, Heart } from 'lucide-react';

const STATUS_OPTS = [
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'sold', label: 'Sold' },
  { value: 'archived', label: 'Archived' },
];
const TYPE_OPTS = [
  { value: 'sale', label: 'For Sale' },
  { value: 'rent', label: 'For Rent' },
];

function fmtPrice(n: number) {
  if (n >= 10_000_000) return '₹' + (n / 10_000_000).toFixed(1) + 'Cr';
  if (n >= 100_000) return '₹' + (n / 100_000).toFixed(1) + 'L';
  return '₹' + n.toLocaleString('en-IN');
}

export default function PropertiesPage() {
  const [data, setData] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [listingType, setListingType] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await propertiesApi.list({ page, limit: 15, search: search || undefined, status: status || undefined, listingType: listingType || undefined });
      const d = res.data;
      setData(d.data ?? d.properties ?? []);
      setTotal(d.total ?? 0);
      setTotalPages(d.totalPages ?? 1);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, listingType]);

  useEffect(() => { setPage(1); }, [search, status, listingType]);
  useEffect(() => { load(); }, [load]);

  const updateProperty = async (id: string, payload: Record<string, unknown>) => {
    setUpdating(id);
    try {
      await propertiesApi.update(id, payload);
      await load();
    } finally {
      setUpdating(null);
    }
  };

  const deleteProperty = async () => {
    if (!deleteTarget) return;
    await propertiesApi.delete(deleteTarget);
    setDeleteTarget(null);
    await load();
  };

  const owner = (p: Property) => typeof p.owner === 'object' && p.owner
    ? `${p.owner.firstName} ${p.owner.lastName}`
    : '—';

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Properties"
        sub={`${total.toLocaleString()} total listings`}
      />

      {/* Filters */}
      <div className="card p-4 mb-5 flex flex-wrap gap-3 items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search title or city…" />
        <FilterSelect value={status} onChange={setStatus} options={STATUS_OPTS} placeholder="All statuses" />
        <FilterSelect value={listingType} onChange={setListingType} options={TYPE_OPTS} placeholder="All types" />
        <div className="ml-auto text-ink-400 text-xs">{total} results</div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? <Spinner /> : data.length === 0 ? <EmptyState /> : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Owner</th>
                  <th>Price</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Stats</th>
                  <th>Featured</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map(p => (
                  <tr key={p._id}>
                    <td>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-ink-100 overflow-hidden shrink-0">
                          {p.images?.[0] ? (
                            <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Home className="w-4 h-4 text-ink-300" /></div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-500 text-ink-800 text-sm truncate max-w-[180px]">{p.title}</p>
                          <p className="text-ink-400 text-xs truncate">{p.address?.city}, {p.address?.state}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-ink-600 text-xs">{owner(p)}</td>
                    <td className="font-500 text-ink-800 text-sm whitespace-nowrap">{fmtPrice(p.price)}</td>
                    <td><StatusBadge value={p.listingType} /></td>
                    <td><StatusBadge value={p.status} /></td>
                    <td>
                      <div className="flex items-center gap-3 text-xs text-ink-400">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{p.views}</span>
                        <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{p.saves}</span>
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => updateProperty(p._id, { isFeatured: !p.isFeatured })}
                        disabled={updating === p._id}
                        className={`transition-colors ${p.isFeatured ? 'text-gold-500 hover:text-gold-300' : 'text-ink-300 hover:text-gold-400'}`}
                        title={p.isFeatured ? 'Unfeature' : 'Feature'}
                      >
                        <Star className="w-4 h-4" fill={p.isFeatured ? 'currentColor' : 'none'} />
                      </button>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 justify-end">
                        {p.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateProperty(p._id, { status: 'active' })}
                              disabled={updating === p._id}
                              className="text-emerald-500 hover:text-emerald-700 transition-colors"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => updateProperty(p._id, { status: 'rejected' })}
                              disabled={updating === p._id}
                              className="text-red-400 hover:text-red-600 transition-colors"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {p.status === 'active' && (
                          <button
                            onClick={() => updateProperty(p._id, { status: 'archived' })}
                            disabled={updating === p._id}
                            className="text-ink-400 hover:text-ink-600 text-xs transition-colors"
                            title="Archive"
                          >
                            Archive
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget(p._id)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && data.length > 0 && (
          <div className="px-4 pb-4">
            <Pagination page={page} totalPages={totalPages} onPage={setPage} />
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Property"
        message="This will permanently remove the listing. This action cannot be undone."
        onConfirm={deleteProperty}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </div>
  );
}
