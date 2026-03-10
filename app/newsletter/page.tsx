'use client';
import { useDataCache } from '@/lib/data-cache-context';
import { useEffect, useState, useCallback } from 'react';
import { newsletterApi } from '@/lib/api';
import { Subscriber, PaginatedResponse } from '@/types';
import {
  Card, StatusBadge, Button, EmptyState, Spinner,
  Pagination, Table, Th, Td, Tr,
} from '@/components/ui';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { Mail, Search, Download, CheckCircle, XCircle } from 'lucide-react';

export default function NewsletterPage() {
  const { get, set } = useDataCache();
  const [subs, setSubs]           = useState<Subscriber[]>([]);
  const [loading, setLoading]     = useState(true);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const limit                      = 20;
  const [activeFilter, setActive] = useState<string>('');
  const [search, setSearch]       = useState('');

  const fetch = useCallback((force = false) => {
    const params: any = { page, limit };
    if (activeFilter !== '') params.active = activeFilter;
    const cacheKey = 'newsletter:' + JSON.stringify(params);
    if (!force) {
      const cached = get<{ data: Subscriber[]; total: number }>(cacheKey);
      if (cached) { setSubs(cached.data); setTotal(cached.total); setLoading(false); return; }
    }
    setLoading(true);
    newsletterApi.list(params)
      .then(res => {
        const d: PaginatedResponse<Subscriber> = res.data;
        set(cacheKey, { data: d.data, total: d.pagination.pages });
        setSubs(d.data); setTotal(d.pagination.pages);
      })
      .finally(() => setLoading(false));
  }, [page, activeFilter, get, set]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { setPage(1); }, [activeFilter]);

  const filtered = search
    ? subs.filter(s => s.email.toLowerCase().includes(search.toLowerCase()))
    : subs;

  const handleExport = () => {
    const csv = 'Email,Status,Subscribed\n' +
      subs.map(s => `${s.email},${s.isActive ? 'Active' : 'Inactive'},${formatDate(s.createdAt)}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url; a.download = '99hb-subscribers.csv'; a.click();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-4xl tracking-widest mb-1" style={{ color: 'var(--text-primary)' }}>
            NEWSLETTER
          </h1>
          <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Email subscribers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-display text-3xl tracking-wide" style={{ color: 'var(--accent)' }}>{total}</p>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Subscribers</p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              placeholder="Search email..."
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
            value={activeFilter}
            onChange={e => setActive(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--input-bg)',
              border: '1px solid var(--border-strong)',
              borderRadius: '12px',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
              minWidth: '130px',
              transition: 'border-color 0.2s',
            }}
          >
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            backgroundColor: 'var(--accent-dim)',
            border: '1px solid var(--accent-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CheckCircle className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p className="font-display text-2xl" style={{ color: 'var(--accent)' }}>{subs.filter(s => s.isActive).length}</p>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Active</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            backgroundColor: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <XCircle className="w-5 h-5" style={{ color: '#f87171' }} />
          </div>
          <div>
            <p className="font-display text-2xl" style={{ color: '#f87171' }}>{subs.filter(s => !s.isActive).length}</p>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Unsubscribed</p>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Mail className="w-7 h-7" />} title="No Subscribers" description="No subscribers found." />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Email</Th>
                  <Th>Status</Th>
                  <Th>Subscribed</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <Tr key={s._id}>
                    <Td>
                      <div className="flex items-center gap-2">
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%',
                          backgroundColor: 'var(--accent-dim)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Mail className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                        </div>
                        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{s.email}</span>
                      </div>
                    </Td>
                    <Td>
                      {s.isActive
                        ? <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--accent)' }}><CheckCircle className="w-3.5 h-3.5" />Active</span>
                        : <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}><XCircle className="w-3.5 h-3.5" />Inactive</span>
                      }
                    </Td>
                    <Td><span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatRelativeTime(s.createdAt)}</span></Td>
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
    </div>
  );
}