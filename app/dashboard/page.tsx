'use client';
import { useEffect, useState } from 'react';
import { statsApi } from '@/lib/api';
import { useDataCache } from '@/lib/data-cache-context';
import { Stats } from '@/types';
import { StatCard, StatusBadge, Card, EmptyState, Avatar } from '@/components/ui';
import { formatNumber, formatCurrency, formatRelativeTime } from '@/lib/utils';
import {
  Users, Home, MessageSquare, Mail, TrendingUp,
  CheckCircle, Eye, AlertCircle, Activity, Building2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts';

const COLORS = ['var(--accent)', '#00b89e', '#007a69', '#004d44'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      backgroundColor: 'var(--bg-card)', border: '1px solid var(--accent-border)',
      borderRadius: '10px', padding: '10px 12px', fontSize: '11px',
    }}>
      {label && <p style={{ color: 'var(--text-muted)', marginBottom: '6px' }}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {formatNumber(p.value)}</p>
      ))}
    </div>
  );
};

const CACHE_KEY = 'stats';

export default function DashboardPage() {
  const { get, set } = useDataCache();
  const [stats, setStats] = useState<Stats | null>(() => get<Stats>(CACHE_KEY) ?? null);
  const [loading, setLoading] = useState(!get(CACHE_KEY));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (get<Stats>(CACHE_KEY)) return;
    statsApi.get()
      .then(res => { const data = res.data.data; set(CACHE_KEY, data); setStats(data); })
      .catch(err => setError(err.response?.data?.message || 'Failed to load stats'))
      .finally(() => setLoading(false));
  }, [get, set]);

  // ─── Skeleton ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex flex-col gap-5 animate-pulse">
      <div className="h-8 w-48 rounded-xl" style={{ backgroundColor: 'var(--bg-mid)' }} />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => <div key={i} className="h-28 rounded-2xl" style={{ backgroundColor: 'var(--bg-mid)' }} />)}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl" style={{ backgroundColor: 'var(--bg-mid)' }} />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 h-64 rounded-2xl" style={{ backgroundColor: 'var(--bg-mid)' }} />
        <div className="h-64 rounded-2xl" style={{ backgroundColor: 'var(--bg-mid)' }} />
      </div>
    </div>
  );

  if (error || !stats) return (
    <EmptyState icon={<AlertCircle className="w-8 h-8" />}
      title="Failed to Load" description={error || 'Unable to fetch stats.'} />
  );

  const weeklyTrend = Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    views: Math.floor(Math.random() * 400) + 100,
    inquiries: Math.floor(Math.random() * 30) + 5,
  }));

  const userDist = [
    { name: 'Buyers',  value: stats.webUsers?.buyers  ?? 0 },
    { name: 'Sellers', value: stats.webUsers?.sellers ?? 0 },
    { name: 'Agents',  value: stats.webUsers?.agents  ?? 0 },
  ];

  const propertyStats = [
    { name: 'For Sale', value: stats.properties.forSale },
    { name: 'For Rent', value: stats.properties.forRent },
    { name: 'Pending',  value: stats.properties.pending },
    { name: 'Active',   value: stats.properties.active },
  ];

  return (
    <div className="flex flex-col gap-5 lg:gap-7 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl tracking-widest mb-1"
            style={{ color: 'var(--text-primary)' }}>
            DASHBOARD
          </h1>
          <p className="text-xs uppercase tracking-widest flex items-center gap-1.5"
            style={{ color: 'var(--text-muted)' }}>
            <Activity className="w-3 h-3" />
            Real-time platform overview
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border"
          style={{ backgroundColor: 'var(--accent-dim)', borderColor: 'var(--accent-border)' }}>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent)' }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Live</span>
        </div>
      </div>

      {/* ── Primary Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
        <StatCard label="Web Users"   value={formatNumber(stats.totals.webUsers ?? 0)}   icon={<Users className="w-4 h-4" />}        trend={{ value: 12.5, label: 'vs last mo' }} accent />
        <StatCard label="Admin Users" value={formatNumber(stats.totals.adminUsers ?? 0)} icon={<Building2 className="w-4 h-4" />} />
        <StatCard label="Properties"  value={formatNumber(stats.totals.properties)}       icon={<Home className="w-4 h-4" />}         sub={`${stats.properties.pending} pending`} trend={{ value: 8.3, label: 'vs last mo' }} accent />
        <StatCard label="Inquiries"   value={formatNumber(stats.totals.inquiries)}         icon={<MessageSquare className="w-4 h-4" />} trend={{ value: 15.7, label: 'vs last mo' }} />
        <StatCard label="Subscribers" value={formatNumber(stats.totals.subscribers)}       icon={<Mail className="w-4 h-4" />}         trend={{ value: 23.1, label: 'vs last mo' }} accent />
      </div>

      {/* ── Secondary Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard label="Active Listings" value={stats.properties.active}                   icon={<CheckCircle className="w-4 h-4" />} />
        <StatCard label="For Sale"        value={stats.properties.forSale}                  icon={<TrendingUp className="w-4 h-4" />} />
        <StatCard label="For Rent"        value={stats.properties.forRent}                  icon={<Home className="w-4 h-4" />} />
        <StatCard label="Total Views"     value={formatNumber(stats.engagement.totalViews)} icon={<Eye className="w-4 h-4" />} />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">

        {/* Weekly Activity */}
        <Card className="p-4 sm:p-5 md:col-span-2">
          <div className="flex items-start sm:items-center justify-between flex-wrap gap-2 mb-4 sm:mb-5">
            <div>
              <h3 className="font-display text-base lg:text-xl tracking-wide"
                style={{ color: 'var(--text-primary)' }}>Weekly Activity</h3>
              <p className="text-[10px] uppercase tracking-widest mt-0.5"
                style={{ color: 'var(--text-muted)' }}>Views & inquiries</p>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 text-xs">
              <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: 'var(--accent)' }} /> Views
              </span>
              <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#007a69' }} /> Inquiries
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weeklyTrend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--accent)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#007a69" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#007a69" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="views"     stroke="var(--accent)" strokeWidth={2} fill="url(#gv)" name="Views" />
              <Area type="monotone" dataKey="inquiries" stroke="#007a69"       strokeWidth={2} fill="url(#gi)" name="Inquiries" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* User Distribution */}
        <Card className="p-4 sm:p-5">
          <h3 className="font-display text-base lg:text-xl tracking-wide mb-4 sm:mb-5"
            style={{ color: 'var(--text-primary)' }}>User Mix</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={userDist} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={4} dataKey="value">
                {userDist.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── Property Stats Bar ── */}
      <Card className="p-4 sm:p-5">
        <h3 className="font-display text-base lg:text-xl tracking-wide mb-4 sm:mb-5"
          style={{ color: 'var(--text-primary)' }}>Property Breakdown</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={propertyStats} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" fill="var(--accent)" fillOpacity={0.85} radius={[6, 6, 0, 0]} name="Count" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* ── Recent Activity ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">

        {/* Recent Users */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <h3 className="font-display text-base lg:text-xl tracking-wide" style={{ color: 'var(--text-primary)' }}>Recent Users</h3>
            <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Last 5</span>
          </div>
          <div className="flex flex-col gap-1">
            {stats.recentUsers.map((user) => (
              <div key={user._id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors table-row-hover">
                <Avatar firstName={user.firstName} lastName={user.lastName} avatar={user.avatar} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <StatusBadge value={user.role} />
                  <p className="text-[10px] mt-1 hidden sm:block" style={{ color: 'var(--text-muted)' }}>
                    {formatRelativeTime(user.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Properties */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <h3 className="font-display text-base lg:text-xl tracking-wide" style={{ color: 'var(--text-primary)' }}>Recent Listings</h3>
            <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Last 5</span>
          </div>
          <div className="flex flex-col gap-1">
            {stats.recentProperties.map((property) => (
              <div key={property._id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors table-row-hover">
                <div className="w-11 h-11 rounded-xl shrink-0 overflow-hidden flex items-center justify-center border"
                  style={{ backgroundColor: 'var(--bg-mid)', borderColor: 'var(--border)' }}>
                  {property.images?.[0]
                    ? <img src={property.images[0].url} alt="" className="w-full h-full object-cover" />
                    : <Home className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {property.title}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {property.address?.city}
                    <span className="hidden sm:inline"> · {formatCurrency(property.price)}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <StatusBadge value={property.status} />
                  <p className="text-[10px] mt-1 hidden sm:block" style={{ color: 'var(--text-muted)' }}>
                    {formatRelativeTime(property.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}