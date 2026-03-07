export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n?.toString() ?? '0';
}

export function formatCurrency(n: number): string {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)} L`;
  return `₹${n?.toLocaleString('en-IN') ?? '0'}`;
}

export function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function formatRelativeTime(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 0) return formatDate(d); // future dates
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

export function getInitials(first?: string, last?: string): string {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '??';
}
// ─── Type Guards for populated Mongoose refs ─────────────────
// Mongoose fields typed as `string | ApiUser` etc. are IDs when
// not populated, objects when populated. Use these to narrow safely.

import type { ApiUser, ApiAdminUser, ApiProperty, ApiInquiry, ApiReview, ApiSupportTicket } from '@/types';

export function isPopulatedUser(v: string | ApiUser | null | undefined): v is ApiUser {
  return typeof v === 'object' && v !== null && '_id' in v;
}

export function isPopulatedAdmin(v: string | ApiAdminUser | null | undefined): v is ApiAdminUser {
  return typeof v === 'object' && v !== null && '_id' in v;
}

export function isPopulatedProperty(v: string | ApiProperty | null | undefined): v is ApiProperty {
  return typeof v === 'object' && v !== null && '_id' in v;
}

/** Safely get a populated user's display name, fallback to ID string */
export function userName(v: string | ApiUser | null | undefined): string {
  if (isPopulatedUser(v)) return `${v.firstName} ${v.lastName}`.trim();
  return v ?? '—';
}

/** Safely get a populated user's email */
export function userEmail(v: string | ApiUser | null | undefined): string {
  if (isPopulatedUser(v)) return v.email;
  return '—';
}

/** Safely get a populated user's avatar */
export function userAvatar(v: string | ApiUser | null | undefined): string | null {
  if (isPopulatedUser(v)) return v.avatar ?? null;
  return null;
}

/** Safely get a populated property's title */
export function propertyTitle(v: string | ApiProperty | null | undefined): string {
  if (isPopulatedProperty(v)) return v.title;
  return v ?? '—';
}