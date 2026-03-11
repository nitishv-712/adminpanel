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
        set(cacheKey, { data: d.data, total: d.pagination.total});
        setSubs(d.data); setTotal(d.pagination.total);
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
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl tracking-widest mb-1"
            style={{ color: 'var(--text-primary)' }}>
            NEWSLETTER
          </h1>
          <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Email subscribers
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="text-right">
            <p className="font-display text-2xl sm:text-3xl tracking-wide" style={{ color: 'var(--accent)' }}>{total}</p>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Subscribers</p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl shrink-0 flex items-center justify-center border"
            style={{ backgroundColor: 'var(--accent-dim)', borderColor: 'var(--accent-border)' }}>
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p className="font-display text-xl sm:text-2xl" style={{ color: 'var(--accent)' }}>
              {subs.filter(s => s.isActive).length}
            </p>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Active</p>
          </div>
        </Card>
        <Card className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl shrink-0 flex items-center justify-center border"
            style={{ backgroundColor: 'rgba(248,113,113,0.08)', borderColor: 'rgba(248,113,113,0.15)' }}>
            <XCircle className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#f87171' }} />
          </div>
          <div>
            <p className="font-display text-xl sm:text-2xl" style={{ color: '#f87171' }}>
              {subs.filter(s => !s.isActive).length}
            </p>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Unsubscribed</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              placeholder="Search email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, width: '100%', paddingLeft: '36px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-strong)'}
            />
          </div>
          <select
            value={activeFilter}
            onChange={e => setActive(e.target.value)}
            style={{ ...inputStyle, padding: '8px 12px', width: '100%' }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-strong)'}
          >
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </Card>

      {/* Table — desktop */}
      <Card className="hidden sm:block">
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
                        <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center"
                          style={{ backgroundColor: 'var(--accent-dim)' }}>
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

      {/* Cards — mobile */}
      <div className="flex flex-col gap-2 sm:hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Mail className="w-7 h-7" />} title="No Subscribers" description="No subscribers found." />
        ) : (
          <>
            {filtered.map(s => (
              <Card key={s._id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: 'var(--accent-dim)' }}>
                  <Mail className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{s.email}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{formatRelativeTime(s.createdAt)}</p>
                </div>
                {s.isActive
                  ? <span className="flex items-center gap-1 text-xs shrink-0" style={{ color: 'var(--accent)' }}>
                      <CheckCircle className="w-3.5 h-3.5" />Active
                    </span>
                  : <span className="flex items-center gap-1 text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                      <XCircle className="w-3.5 h-3.5" />Inactive
                    </span>
                }
              </Card>
            ))}
            <div className="pt-2">
              <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPage={setPage} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}