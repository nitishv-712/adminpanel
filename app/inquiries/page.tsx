'use client';
import { useEffect, useState, useCallback } from 'react';
import { inquiriesApi } from '@/lib/api';
import { Inquiry } from '@/types';
import {
  PageHeader, StatusBadge, Pagination,
  FilterSelect, Spinner, EmptyState
} from '@/components/ui';
import { ChevronDown, Home, User } from 'lucide-react';
import clsx from 'clsx';

const STATUS_OPTS = [
  { value: 'new', label: 'New' },
  { value: 'read', label: 'Read' },
  { value: 'replied', label: 'Replied' },
  { value: 'closed', label: 'Closed' },
];

const NEXT_STATUS: Record<string, string[]> = {
  new: ['read', 'replied', 'closed'],
  read: ['replied', 'closed'],
  replied: ['closed'],
  closed: ['new'],
};

function fmtDate(s: string) {
  return new Date(s).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function InquiryRow({ inq, onUpdate }: { inq: Inquiry; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);

  const prop = typeof inq.property === 'object' ? inq.property : null;
  const sender = typeof inq.sender === 'object' && inq.sender ? inq.sender : null;
  const name = sender ? `${sender.firstName} ${sender.lastName}` : inq.guestName ?? 'Guest';
  const email = sender ? sender.email : inq.guestEmail ?? '—';

  const changeStatus = async (status: string) => {
    setUpdating(true);
    try {
      await inquiriesApi.updateStatus(inq._id, status);
      onUpdate();
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <tr
        className="cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center text-gold-700 text-xs font-600 shrink-0">
              {name[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-500 text-ink-800 text-sm">{name}</p>
              <p className="text-ink-400 text-xs">{email}</p>
            </div>
          </div>
        </td>
        <td>
          {prop ? (
            <div className="flex items-center gap-2 text-sm text-ink-600">
              <Home className="w-3.5 h-3.5 text-ink-400 shrink-0" />
              <span className="truncate max-w-[180px]">{prop.title}</span>
            </div>
          ) : <span className="text-ink-300 text-xs">Unknown property</span>}
        </td>
        <td className="text-ink-500 text-xs max-w-[200px]">
          <p className="truncate">{inq.message}</p>
        </td>
        <td><StatusBadge value={inq.status} /></td>
        <td className="text-ink-400 text-xs whitespace-nowrap">{fmtDate(inq.createdAt)}</td>
        <td>
          <ChevronDown className={clsx('w-4 h-4 text-ink-400 transition-transform', expanded && 'rotate-180')} />
        </td>
      </tr>
      {expanded && (
        <tr className="bg-ink-50">
          <td colSpan={6} className="px-4 py-4">
            <div className="flex gap-6">
              <div className="flex-1">
                <p className="text-xs text-ink-400 uppercase tracking-widest font-500 mb-2">Message</p>
                <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-wrap">{inq.message}</p>
              </div>
              <div className="shrink-0">
                <p className="text-xs text-ink-400 uppercase tracking-widest font-500 mb-2">Update Status</p>
                <div className="flex flex-col gap-1.5">
                  {NEXT_STATUS[inq.status]?.map(s => (
                    <button
                      key={s}
                      onClick={() => changeStatus(s)}
                      disabled={updating}
                      className="text-xs px-3 py-1.5 rounded-lg border border-ink-200 text-ink-600 hover:bg-ink-100 transition-colors capitalize disabled:opacity-50"
                    >
                      Mark as {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function InquiriesPage() {
  const [data, setData] = useState<Inquiry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inquiriesApi.list({ page, limit: 15, status: status || undefined });
      const d = res.data;
      setData(d.data ?? []);
      setTotal(d.total ?? 0);
      setTotalPages(d.totalPages ?? 1);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { setPage(1); }, [status]);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Inquiries" sub={`${total.toLocaleString()} total inquiries`} />

      <div className="card p-4 mb-5 flex flex-wrap gap-3 items-center">
        <FilterSelect value={status} onChange={setStatus} options={STATUS_OPTS} placeholder="All statuses" />
        <div className="ml-auto text-ink-400 text-xs">{total} results · click a row to expand</div>
      </div>

      <div className="card overflow-hidden">
        {loading ? <Spinner /> : data.length === 0 ? <EmptyState /> : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>From</th>
                  <th>Property</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.map(inq => (
                  <InquiryRow key={inq._id} inq={inq} onUpdate={load} />
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
    </div>
  );
}
