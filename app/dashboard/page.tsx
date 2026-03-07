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
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--accent-border)',
      borderRadius: '10px',
      padding: '10px 12px',
      fontSize: '11px',
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
      .then(res => {
        const data = res.data.data;
        set(CACHE_KEY, data);
        setStats(data);
      })
      .catch(err => setError(err.response?.data?.message || 'Failed to load stats'))
      .finally(() => setLoading(false));
  }, [get, set]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-pulse">
      <div style={{ height: '32px', width: '192px', backgroundColor: 'var(--bg-mid)', borderRadius: '10px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[...Array(4)].map((_, i) => <div key={i} style={{ height: '112px', backgroundColor: 'var(--bg-mid)', borderRadius: '16px' }} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {[...Array(3)].map((_, i) => <div key={i} style={{ height: '256px', backgroundColor: 'var(--bg-mid)', borderRadius: '16px' }} />)}
      </div>
    </div>
  );

  if (error || !stats) return (
    <EmptyState icon={<AlertCircle style={{ width: '32px', height: '32px' }} />}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }} className="animate-fade-in">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '36px', color: 'var(--text-primary)', letterSpacing: '0.1em', marginBottom: '4px' }}>
            DASHBOARD
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity style={{ width: '13px', height: '13px' }} />
            Real-time platform overview
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 16px',
          backgroundColor: 'var(--accent-dim)',
          border: '1px solid var(--accent-border)',
          borderRadius: '10px',
        }}>
          <div style={{ width: '6px', height: '6px', backgroundColor: 'var(--accent)', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
          <span style={{ color: 'var(--accent)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Live</span>
        </div>
      </div>

      {/* Primary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
        <StatCard label="Web Users"   value={formatNumber(stats.totals.webUsers ?? 0)}   icon={<Users style={{ width: '18px', height: '18px' }} />} trend={{ value: 12.5, label: 'vs last mo' }} accent />
        <StatCard label="Admin Users" value={formatNumber(stats.totals.adminUsers ?? 0)} icon={<Building2 style={{ width: '18px', height: '18px' }} />} />
        <StatCard label="Properties"  value={formatNumber(stats.totals.properties)}       icon={<Home style={{ width: '18px', height: '18px' }} />} sub={`${stats.properties.pending} pending`} trend={{ value: 8.3, label: 'vs last mo' }} accent />
        <StatCard label="Inquiries"   value={formatNumber(stats.totals.inquiries)}         icon={<MessageSquare style={{ width: '18px', height: '18px' }} />} trend={{ value: 15.7, label: 'vs last mo' }} />
        <StatCard label="Subscribers" value={formatNumber(stats.totals.subscribers)}       icon={<Mail style={{ width: '18px', height: '18px' }} />} trend={{ value: 23.1, label: 'vs last mo' }} accent />
      </div>

      {/* Secondary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <StatCard label="Active Listings" value={stats.properties.active}                       icon={<CheckCircle style={{ width: '16px', height: '16px' }} />} />
        <StatCard label="For Sale"        value={stats.properties.forSale}                      icon={<TrendingUp style={{ width: '16px', height: '16px' }} />} />
        <StatCard label="For Rent"        value={stats.properties.forRent}                      icon={<Home style={{ width: '16px', height: '16px' }} />} />
        <StatCard label="Total Views"     value={formatNumber(stats.engagement.totalViews)}     icon={<Eye style={{ width: '16px', height: '16px' }} />} />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>

        {/* Weekly Activity */}
        <Card className="p-6">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3 className="font-display" style={{ fontSize: '20px', color: 'var(--text-primary)', letterSpacing: '0.05em' }}>Weekly Activity</h3>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>Views & inquiries</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent)', display: 'inline-block' }} /> Views
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#007a69', display: 'inline-block' }} /> Inquiries
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
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
        <Card className="p-6">
          <h3 className="font-display" style={{ fontSize: '20px', color: 'var(--text-primary)', letterSpacing: '0.05em', marginBottom: '20px' }}>User Mix</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={userDist} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                {userDist.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Property Stats Bar */}
      <Card className="p-6">
        <h3 className="font-display" style={{ fontSize: '20px', color: 'var(--text-primary)', letterSpacing: '0.05em', marginBottom: '20px' }}>Property Breakdown</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={propertyStats} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" fill="var(--accent)" fillOpacity={0.85} radius={[6, 6, 0, 0]} name="Count" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Recent Users */}
        <Card className="p-6">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 className="font-display" style={{ fontSize: '20px', color: 'var(--text-primary)', letterSpacing: '0.05em' }}>Recent Users</h3>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Last 5</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {stats.recentUsers.map((user) => (
              <div key={user._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', transition: 'background 0.15s ease' }} className="table-row-hover">
                <Avatar firstName={user.firstName} lastName={user.lastName} avatar={user.avatar} size="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.firstName} {user.lastName}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.email}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <StatusBadge value={user.role} />
                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>{formatRelativeTime(user.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Properties */}
        <Card className="p-6">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 className="font-display" style={{ fontSize: '20px', color: 'var(--text-primary)', letterSpacing: '0.05em' }}>Recent Listings</h3>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Last 5</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {stats.recentProperties.map((property) => (
              <div key={property._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', transition: 'background 0.15s ease' }} className="table-row-hover">
                <div style={{
                  width: '44px', height: '44px', borderRadius: '10px',
                  backgroundColor: 'var(--bg-mid)',
                  border: '1px solid var(--border)',
                  overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {property.images?.[0] ? (
                    <img src={property.images[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Home style={{ width: '16px', height: '16px', color: 'var(--text-muted)' }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {property.title}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {property.address?.city} · {formatCurrency(property.price)}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <StatusBadge value={property.status} />
                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>{formatRelativeTime(property.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}