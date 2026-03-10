export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: Pagination;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: Pagination;
}

// ─── RBAC ─────────────────────────────────────────────────────────────────────

export type Resource =
  | 'users' | 'adminUsers' | 'properties' | 'reviews'
  | 'inquiries' | 'messages' | 'supportTickets' | 'ticketMessages'
  | 'newsletter' | 'comparisons' | 'savedSearches' | 'searchHistory'
  | 'otp' | 'auditLogs';

export type Action =
  | 'read' | 'create' | 'update' | 'delete'
  | 'verify' | 'ban'
  | 'approve' | 'feature' | 'archive'
  | 'reject' | 'close' | 'assign' | 'resolve'
  | 'export' | 'purge';

export type PermissionMap = {
  [R in Resource]?: Partial<Record<Action, boolean>>;
};

export type AdminRoleName = 'superadmin' | 'admin' | 'moderator' | 'support';

export interface AdminRoleRef {
  _id: string;
  name: AdminRoleName;
  label: string;
}

export interface AdminGroupRef {
  _id: string;
  name: string;
}

// ─── AdminUser ────────────────────────────────────────────────────────────────

export interface ApiAdminUser {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: AdminRoleRef;
  group: AdminGroupRef | null;
  avatar: string | null;
  isActive: boolean;
  permissions: PermissionMap;
  createdBy: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export type UserRole = 'buyer' | 'seller' | 'agent';

export interface PanCard {
  panCardNumber: string | null;
  panCardImage: string | null;
  isPanCardVerified: boolean;
}

export interface AadharCard {
  aadharCardNumber: string | null;
  aadharCardImage: string | null;
  isAadharCardVerified: boolean;
}

export interface ApiUser {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  isGmailVerified: boolean;
  phone: string | null;
  isPhoneVerified: boolean;
  role: UserRole;
  avatar: string | null;
  isVerified: boolean;
  panCard: PanCard;
  aadharCard: AadharCard;
  createdAt: string;
  updatedAt: string;
}

// ─── Property ─────────────────────────────────────────────────────────────────

export interface PropertyAddress {
  street?: string;
  city: string;
  state?: string;
  zip?: string;
  country: string;
}

export interface PropertyLocation {
  type: 'Point';
  coordinates: [number, number];
}

export interface PropertyImage {
  _id: string;
  url: string;
  filename?: string;
  isPrimary: boolean;
}

export type ListingType    = 'sale' | 'rent';
export type PropertyType   = 'House' | 'Apartment' | 'Villa' | 'Penthouse' | 'Townhouse' | 'Land' | 'Office';
export type PropertyStatus = 'pending' | 'active' | 'sold' | 'rented' | 'archived';
export type PropertyBadge  = 'Premium' | 'New' | 'Featured' | null;

export interface ApiProperty {
  _id: string;
  title: string;
  description?: string;
  listingType: ListingType;
  propertyType: PropertyType;
  status: PropertyStatus;
  badge: PropertyBadge;
  price: number;
  address: PropertyAddress;
  location: PropertyLocation;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  yearBuilt?: number;
  images: PropertyImage[];
  owner: ApiUser | string;
  views: number;
  saves: number;
  inquiries: number;
  isFeatured: boolean;
  priceLabel: string;
  tag: string;
  locationString: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Inquiry ──────────────────────────────────────────────────────────────────

export type InquiryStatus = 'active' | 'closed';

export interface ApiMessage {
  _id: string;
  inquiry: string;
  sender: string;
  role: 'user' | 'owner' | 'admin';
  text: string;
  visibleToUser: boolean;
  visibleToOwner: boolean;
  isEditedByAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiInquiry {
  _id: string;
  property: string | ApiProperty;
  user: string | ApiUser;
  owner: string | ApiUser;
  status: InquiryStatus;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SingleInquiryData {
  inquiry: ApiInquiry;
  messages: ApiMessage[];
}

// ─── Review ───────────────────────────────────────────────────────────────────

export type ReviewStatus = 'published' | 'pending' | 'rejected';

export interface ApiReview {
  _id: string;
  user: ApiUser | string;
  property: ApiProperty | string;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string;
  comment: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}

// ─── Support Ticket ───────────────────────────────────────────────────────────

export type TicketCategory = 'technical' | 'billing' | 'account' | 'listing' | 'other';
export type TicketPriority = 'low' | 'medium' | 'high';
export type TicketStatus   = 'open' | 'in-progress' | 'resolved' | 'closed';

export interface ApiTicketMessage {
  _id: string;
  ticket: string;
  sender: ApiUser | string;
  text: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiSupportTicket {
  _id: string;
  user: ApiUser | string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo: ApiAdminUser | string | null;
  lastMessageAt: string;
  messageCount: number;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketDetailResponse {
  ticket: ApiSupportTicket;
  messages: ApiTicketMessage[];
}

// ─── Newsletter ───────────────────────────────────────────────────────────────

export interface ApiNewsletter {
  _id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Role & Group ─────────────────────────────────────────────────────────────

export interface ResourcePermission {
  resource: Resource;
  actions: Partial<Record<Action, boolean>>;
}

export interface ApiRole {
  _id: string;
  name: AdminRoleName;
  label: string;
  description: string | null;
  isLocked: boolean;
  permissions: ResourcePermission[];
  createdAt: string;
}

export interface ApiGroup {
  _id: string;
  name: string;
  description: string | null;
  role: AdminRoleRef;
  permissions: ResourcePermission[];
  members: ApiAdminUser[];
  memberCount: number;
  isActive: boolean;
  createdBy: ApiAdminUser | string;
  createdAt: string;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface Stats {
  totals: {
    webUsers: number;
    adminUsers: number;
    properties: number;
    inquiries: number;
    subscribers: number;
  };
  properties: { pending: number; active: number; forSale: number; forRent: number };
  webUsers: { buyers: number; sellers: number; agents: number };
  engagement: { totalViews: number };
  recentUsers: ApiUser[];
  recentProperties: ApiProperty[];
}

export interface SupportTicketStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  highPriorityTickets: number;
  averageResolutionTimeHours: number;
}

// ─── Aliases ──────────────────────────────────────────────────────────────────

export type AdminUser     = ApiAdminUser;
export type User          = ApiUser;
export type Property      = ApiProperty;
export type Inquiry       = ApiInquiry;
export type Review        = ApiReview;
export type SupportTicket = ApiSupportTicket;
export type TicketMessage = ApiTicketMessage;
export type Subscriber    = ApiNewsletter;
export type InquiryMessage = ApiMessage;
export type SupportStats  = SupportTicketStats;
