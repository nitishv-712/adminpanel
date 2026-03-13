'use client';

import { useDataCache } from '@/lib/data-cache-context';
import { useEffect, useState, useCallback } from 'react';
import { leadsApi } from '@/lib/api';
import { ApiLead } from '@/types';
import {
  Card, Button, ConfirmModal,
  EmptyState, Spinner, Pagination, Table, Th, Td, Tr,
} from '@/components/ui';
import { formatRelativeTime } from '@/lib/utils';
import { PhoneCall, MapPin, Trash2, Eye, EyeOff } from 'lucide-react';

export default function LeadsPage() {
  const { get, set, invalidatePrefix } = useDataCache();

  const [leads,   setLeads]   = useState<ApiLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const limit = 15;

  /* filter: 'all' | 'true' | 'false' */
  const [viewedFilter, setViewedFilter] = useState<'all' | 'true' | 'false'>('all');

  /* delete confirm */
  const [deleteTarget, setDeleteTarget] = useState<ApiLead | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  /* ── fetch ── */
  const fetchList = useCallback((force = false) => {
    const params = { page, limit, ...(viewedFilter !== 'all' && { viewed: viewedFilter }) };
    const cacheKey = 'leads:' + JSON.stringify(params);

    if (!force) {
      const cached = get<{ data: ApiLead[]; total: number }>(cacheKey);
      if (cached) {
        setLeads(cached.data);
        setTotal(cached.total);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    leadsApi.list(params as any)
      .then(res => {
        const d = res.data;
        setLeads(d.data);
        setTotal(d.pagination.total);
        set(cacheKey, { data: d.data, total: d.pagination.total });
      })
      .finally(() => setLoading(false));
  }, [page, viewedFilter, get, set]);

  useEffect(() => { invalidatePrefix('leads:'); fetchList(true); }, [fetchList]);
  useEffect(() => { setPage(1); }, [viewedFilter]);

  /* ── auto-mark viewed when row is rendered ── */
  const markViewed = useCallback(async (lead: ApiLead) => {
    if (lead.viewed) return;
    try {
      await leadsApi.markViewed(lead._id);
      // optimistic update in local state
      setLeads(prev =>
        prev.map(l => l._id === lead._id ? { ...l, viewed: true } : l)
      );
      // invalidate cache so next fetch is fresh
      invalidatePrefix('leads:');
    } catch { /* silently ignore */ }
  }, [invalidatePrefix]);

  /* ── delete ── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await leadsApi.delete(deleteTarget._id);
      setDeleteTarget(null);
      invalidatePrefix('leads:');
      fetchList(true);
    } finally {
      setDeleting(false);
    }
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
    width: '100%',
  };

  return (
    <div className="space-y-5 animate-fade-in select-none">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1
            className="font-display text-2xl sm:text-3xl lg:text-4xl tracking-widest mb-1"
            style={{ color: 'var(--text-primary)' }}
          >
            LEADS
          </h1>
          <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Property inquiry submissions
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-display text-2xl sm:text-3xl tracking-wide" style={{ color: 'var(--accent)' }}>
            {total}
          </p>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Total</p>
        </div>
      </div>

      {/* ── Filter ── */}
      <Card className="p-3 sm:p-4">
        <select
          value={viewedFilter}
          onChange={e => setViewedFilter(e.target.value as any)}
          style={inputStyle}
          onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border-strong)')}
        >
          <option value="all">All Leads</option>
          <option value="false">Unviewed</option>
          <option value="true">Viewed</option>
        </select>
      </Card>

      {/* ── Table — desktop ── */}
      <Card className="hidden md:block">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : leads.length === 0 ? (
          <EmptyState
            icon={<PhoneCall className="w-7 h-7" />}
            title="No Leads"
            description="No leads match your filter."
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Intent</Th>
                  <Th>Phone</Th>
                  <Th>Address</Th>
                  <Th>City</Th>
                  <Th>Status</Th>
                  <Th>Received</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => {
                  // auto-mark viewed as soon as the row renders
                  if (!lead.viewed) markViewed(lead);

                  return (
                    <Tr key={lead._id} className="cursor-default">
                      {/* Intent */}
                      <Td>
                        <span
                          className="text-[10px] font-display tracking-widest px-2 py-0.5"
                          style={{
                            background: lead.intent === 'rent'
                              ? 'rgba(0,229,200,0.12)'
                              : 'rgba(99,102,241,0.18)',
                            color: lead.intent === 'rent' ? 'var(--accent)' : '#a78bfa',
                          }}
                        >
                          {lead.intent.toUpperCase()}
                        </span>
                      </Td>

                      {/* Phone */}
                      <Td>
                        <div className="flex items-center gap-1.5">
                          <PhoneCall className="w-3 h-3 shrink-0" style={{ color: 'var(--accent)' }} />
                          <span className="text-xs font-mono" style={{ color: 'var(--text-primary)' }}>
                            {lead.phone}
                          </span>
                        </div>
                      </Td>

                      {/* Address */}
                      <Td>
                        <div className="flex items-start gap-1">
                          <MapPin className="w-3 h-3 mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} />
                          <p className="text-xs max-w-[200px] truncate" style={{ color: 'var(--text-primary)' }}>
                            {lead.address}
                          </p>
                        </div>
                      </Td>

                      {/* City */}
                      <Td>
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {lead.city ?? '—'}{lead.state ? `, ${lead.state}` : ''}
                        </span>
                      </Td>

                      {/* Viewed */}
                      <Td>
                        <div className="flex items-center gap-1">
                          {lead.viewed
                            ? <Eye className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                            : <EyeOff className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />}
                          <span
                            className="text-[10px]"
                            style={{ color: lead.viewed ? 'var(--accent)' : 'var(--text-muted)' }}
                          >
                            {lead.viewed ? 'Viewed' : 'New'}
                          </span>
                        </div>
                      </Td>

                      {/* Date */}
                      <Td>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {formatRelativeTime(lead.createdAt)}
                        </span>
                      </Td>

                      {/* Actions */}
                      <Td>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(lead)}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </Button>
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

      {/* ── Cards — mobile ── */}
      <div className="flex flex-col gap-3 md:hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : leads.length === 0 ? (
          <EmptyState
            icon={<PhoneCall className="w-7 h-7" />}
            title="No Leads"
            description="No leads match your filter."
          />
        ) : (
          <>
            {leads.map(lead => {
              if (!lead.viewed) markViewed(lead);
              return (
                <Card key={lead._id} className="p-4 space-y-3 cursor-default select-none">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className="text-[10px] font-display tracking-widest px-2 py-0.5"
                      style={{
                        background: lead.intent === 'rent'
                          ? 'rgba(0,229,200,0.12)'
                          : 'rgba(99,102,241,0.18)',
                        color: lead.intent === 'rent' ? 'var(--accent)' : '#a78bfa',
                      }}
                    >
                      {lead.intent.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1">
                      {lead.viewed
                        ? <Eye className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                        : <EyeOff className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />}
                      <span
                        className="text-[10px]"
                        style={{ color: lead.viewed ? 'var(--accent)' : 'var(--text-muted)' }}
                      >
                        {lead.viewed ? 'Viewed' : 'New'}
                      </span>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-1.5">
                    <PhoneCall className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
                    <span className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>
                      {lead.phone}
                    </span>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} />
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-primary)' }}>{lead.address}</p>
                      {lead.city && (
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {lead.city}{lead.state ? `, ${lead.state}` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div
                    className="flex items-center justify-between pt-2 border-t"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {formatRelativeTime(lead.createdAt)}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(lead)}>
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </Button>
                  </div>
                </Card>
              );
            })}
            <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPage={setPage} />
          </>
        )}
      </div>

      {/* ── Delete Confirm ── */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Lead"
        message={`Delete the lead from ${deleteTarget?.phone ?? ''}? This cannot be undone.`}
        loading={deleting}
      />
    </div>
  );
}