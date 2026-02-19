'use client';
import { useEffect, useState } from 'react';
import { statsApi } from '@/lib/api';
import { Stats } from '@/types';
import { StatCard, StatusBadge } from '@/components/ui';
import {
  Users, Home, MessageSquare, Mail, TrendingUp,
  Clock, CheckCircle, Eye
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const PIE_COLORS = ['#f59e0b', '#d97706', '#b45309', '#78350f'];

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

function fmtPrice(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statsApi.get()
      .then(r => setStats(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-ink-100 rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-ink-100 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!stats) return <p className="text-ink-500">Failed to load stats.</p>;

  const userPieData = [
    { name: 'Buyers', value: stats.users.buyers },
    { name: 'Sellers', value: stats.users.sellers },
    { name: 'Agents', value: stats.users.agents },
  ];

  const propPieData = [
    { name: 'For Sale', value: stats.properties.forSale },
    { name: 'For Rent', value: stats.properties.forRent },
    { name: 'Pending', value: stats.properties.pending },
  ];

  // Mock trend data (replace with real data if API provides it)
  const trend = Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    views: Math.floor(Math.random() * 300) + 50,
    inquiries: Math.floor(Math.random() * 20) + 2,
  }));

  return (
    <div className="animate-fade-in space-y-7">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900">Dashboard</h1>
        <p className="text-ink-400 text-sm mt-1">Welcome back. Here's what's happening.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={fmt(stats.totals.users)} icon={<Users className="w-5 h-5" />} />
        <StatCard label="Properties" value={fmt(stats.totals.properties)} sub={`${stats.properties.pending} pending approval`} icon={<Home className="w-5 h-5" />} />
        <StatCard label="Inquiries" value={fmt(stats.totals.inquiries)} icon={<MessageSquare className="w-5 h-5" />} />
        <StatCard label="Subscribers" value={fmt(stats.totals.subscribers)} icon={<Mail className="w-5 h-5" />} />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Listings" value={stats.properties.active} icon={<CheckCircle className="w-5 h-5" />} />
        <StatCard label="For Sale" value={stats.properties.forSale} icon={<TrendingUp className="w-5 h-5" />} />
        <StatCard label="For Rent" value={stats.properties.forRent} icon={<Home className="w-5 h-5" />} />
        <StatCard label="Total Views" value={fmt(stats.engagement.totalViews)} icon={<Eye className="w-5 h-5" />} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-5">
        {/* Area chart */}
        <div className="card col-span-2 p-5">
          <p className="font-display font-medium text-ink-800 mb-4">Activity This Week</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gInq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#b0a898' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#b0a898' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e8e5dd', boxShadow: '0 4px 16px rgba(0,0,0,.08)' }} />
              <Area type="monotone" dataKey="views" stroke="#f59e0b" strokeWidth={2} fill="url(#gViews)" name="Views" />
              <Area type="monotone" dataKey="inquiries" stroke="#3b82f6" strokeWidth={2} fill="url(#gInq)" name="Inquiries" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* User distribution pie */}
        <div className="card p-5">
          <p className="font-display font-medium text-ink-800 mb-4">User Roles</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={userPieData} cx="50%" cy="45%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {userPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row: recent users + recent properties */}
      <div className="grid grid-cols-2 gap-5">
        {/* Recent Users */}
        <div className="card p-5">
          <p className="font-display font-medium text-ink-800 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-ink-400" /> Recent Users
          </p>
          <div className="space-y-3">
            {stats.recentUsers.map(u => (
              <div key={u._id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center text-gold-700 text-xs font-600 shrink-0">
                  {u.firstName?.[0]}{u.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink-800 font-500 truncate">{u.firstName} {u.lastName}</p>
                  <p className="text-xs text-ink-400 truncate">{u.email}</p>
                </div>
                <StatusBadge value={u.role} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Properties */}
        <div className="card p-5">
          <p className="font-display font-medium text-ink-800 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-ink-400" /> Recent Listings
          </p>
          <div className="space-y-3">
            {stats.recentProperties.map(p => (
              <div key={p._id} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-ink-100 overflow-hidden shrink-0">
                  {p.images?.[0] ? (
                    <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink-400">
                      <Home className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink-800 font-500 truncate">{p.title}</p>
                  <p className="text-xs text-ink-400 truncate">{p.address?.city} · {fmtPrice(p.price)}</p>
                </div>
                <StatusBadge value={p.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
