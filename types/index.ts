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

// Paginated list response (maps to paginate() helper)
export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: Pagination;
}

// ─── AdminUser  (adminUser.model.js) ─────────────────────────────────────────

export type AdminRole = "admin" | "superadmin";

export interface ApiAdminUser {
  _id: string;
  firstName: string;
  lastName: string;
  /** Virtual */
  fullName: string;
  email: string;
  phone: string | null;
  role: AdminRole;
  avatar: string | null;
  isActive: boolean;
  /** ObjectId ref to AdminUser who created this account */
  createdBy: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  // password, refreshToken are select: false — never returned
}

// ─── User  (user.model.js) ────────────────────────────────────────────────────

export type UserRole = "buyer" | "seller" | "agent";

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
  /** Virtual */
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
  // password, refreshToken, passwordResetToken, passwordResetExpires are select: false
}

// ─── Property  (property.model.js) ───────────────────────────────────────────

export interface PropertyAddress {
  street?: string;
  city: string;
  state?: string;
  zip?: string;
  /** default: "IN" */
  country: string;
}

export interface PropertyLocation {
  type: "Point";
  /** [longitude, latitude] */
  coordinates: [number, number];
}

export interface PropertyImage {
  _id: string;
  url: string;
  filename?: string;
  isPrimary: boolean;
}

export type ListingType    = "sale" | "rent";
export type PropertyType   = "House" | "Apartment" | "Villa" | "Penthouse" | "Townhouse" | "Land" | "Office";
export type PropertyStatus = "pending" | "active" | "sold" | "rented" | "archived";
export type PropertyBadge  = "Premium" | "New" | "Featured" | null;

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
  /** Virtual — e.g. "₹45,00,000" or "₹25,000/mo" */
  priceLabel: string;
  /** Virtual — "For Sale" | "For Rent" */
  tag: string;
  /** Virtual — "City, State" */
  locationString: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Inquiry  (inquiry.model.js) ─────────────────────────────────────────────
export type InquiryStatus = "active" | "closed";

export interface ApiMessage {
  _id: string;
  inquiry: string;
  sender: string;
  role: "user" | "owner" | "admin";
  text: string;
  visibleToUser: boolean;
  visibleToOwner: boolean;
  isEditedByAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiInquiry {
  _id: string;
  property: string | ApiProperty; // Can be ID or populated
  user: string | ApiUser; // Can be ID or populated
  owner: string | ApiUser; // Can be ID or populated
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

export type ReviewStatus = "published" | "pending" | "rejected";

export interface ApiReview {
  _id:       string;
  user:      ApiUser | string;
  property:  ApiProperty | string;
  rating:    1 | 2 | 3 | 4 | 5;
  title:     string;
  comment:   string;
  status:    ReviewStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStats {
  averageRating:   number;
  totalReviews:    number;
  ratingBreakdown: { 5: number; 4: number; 3: number; 2: number; 1: number };
}


// ─── Comparison  (comparison.model.js) ───────────────────────────────────────

export interface PricePerSqftEntry {
  propertyId: string;
  title:      string;
  pricePerSqft: number; // stored as parsed float, not string
}

export interface ComparisonAnalysis {
  totalProperties: number;
  priceRange:   { min: number; max: number; average: number };
  bedroomRange: { min: number; max: number };
  bathroomRange:{ min: number; max: number };
  sqftRange:    { min: number; max: number; average: number };
  pricePerSqft: PricePerSqftEntry[]; // sorted asc by pricePerSqft
}

export interface ApiComparison {
  _id:         string;
  user:        string;           // renamed from userId
  name:        string;
  description: string | null;
  propertyIds: ApiProperty[] | string[]; // populated or raw
  tags:        string[];
  notes:       string | null;
  isPublic:    boolean;
  createdAt:   string;
  updatedAt:   string;
}


// ─── SavedSearch  (savedSearch.model.js) ─────────────────────────────────────
// NOTE: despite the model name, this is actually a saved/bookmarked property

export interface ApiSavedProperty {
  _id: string;
  user: string;
  property: ApiProperty | string;
  /** Model uses savedAt instead of createdAt (no timestamps option set) */
  savedAt: string;
}

// ─── SearchHistory  (searchHistory.model.js) ─────────────────────────────────

export interface ApiSearchHistory {
  _id:       string;
  user:      string;
  query:     string;
  filters:   Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ─── Support Ticket  (supportTicket.model.js) ────────────────────────────────

export type TicketCategory = "technical" | "billing" | "account" | "listing" | "other";
export type TicketPriority = "low" | "medium" | "high";
// NOTE: "waiting-user" is NOT in the model enum — removed from original types
export type TicketStatus   = "open" | "in-progress" | "resolved" | "closed";

export interface ApiTicketMessage {
  _id: string;
  ticket: string;
  sender: ApiUser | string;
  /** Field is "text" in model, NOT "message" */
  text: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiSupportTicket {
  _id: string;
  /** Field is "user" in model, NOT "userId" */
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
  // NOTE: messages are NOT embedded — fetched separately via GET /:id (paginated)
}

// GET /:id response shape (matches paginate() helper output)
export interface TicketDetailResponse {
  ticket: ApiSupportTicket;
  messages: ApiTicketMessage[];
}

// ─── Newsletter  (newsletter.model.js) ───────────────────────────────────────

export interface ApiNewsletter {
  _id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── OTP  (otp.model.js) ─────────────────────────────────────────────────────

export interface ApiOtp {
  _id: string;
  email?: string;
  phone?: string;
  isVerified: boolean;
  attempts: number;
  expiresAt: string;
  createdAt: string;
  // otp field is never returned to client
}

// ─── Upload  (upload.js) ──────────────────────────────────────────────────────

export type UploadFolder = "avatar" | "aadhar" | "pancards" | "properties";

export interface UploadLinkResponse {
  uploadUrl: string;
  viewUrl: string;
  filePath: string;
}

// ─── Analytics ───────────────────────────────────────────────────────────────
// ─── Analytics types ──────────────────────────────────────────────────────────

export interface TrendPoint {
  date:  string; // "YYYY-MM-DD"
  count: number;
}

export interface TopProperty {
  _id:            string;
  title:          string;
  price:          number;
  views:          number;
  saves?:         number;
  inquiries:      number;
  status:         PropertyStatus;
  listingType:    ListingType;
  daysListed:     number;
  conversionRate?: number;
}

export interface InquiryStatusBreakdown {
  active: number;
  closed: number;
}

export interface OwnerAnalytics {
  totalListings:          number;
  activeListings:         number;
  pendingListings:        number;
  soldListings:           number;
  rentedListings:         number;
  archivedListings:       number;
  totalViews:             number;
  totalSaves:             number;
  totalInquiries:         number;
  averageViewsPerListing: number;
  averageSavesPerListing: number;
  conversionRate:         number;
  listingsByType:         { sale: number; rent: number };
  topByViews:             TopProperty[];
  topByInquiries:         TopProperty[];
  inquiryTrend:           TrendPoint[];
  inquiryStatus:          InquiryStatusBreakdown;
}

export interface PropertyAnalytics {
  property: {
    _id:         string;
    title:       string;
    price:       number;
    status:      PropertyStatus;
    listingType: ListingType;
    createdAt:   string;
    daysListed:  number;
  };
  analytics: {
    totalViews:     number;
    totalSaves:     number;
    totalInquiries: number;
    conversionRate: number;
    saveRate:       number;
    inquiryStatus:  InquiryStatusBreakdown;
    inquiryTrend:   TrendPoint[];
    inquiries: {
      _id:           string;
      user:          ApiUser | string;
      status:        "active" | "closed";
      lastMessageAt: string;
      createdAt:     string;
    }[];
  };
}
// Support ticket stats (GET /support/stats)
export interface SupportTicketStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  highPriorityTickets: number;
  averageResolutionTimeHours: number;
}

// ─── Filter / Query helpers ───────────────────────────────────────────────────

export interface PropertyFilters {
  sort?: "newest" | "oldest" | "price_asc" | "price_desc" | "popular";
  page?: number;
  limit?: number;
  type?: ListingType;
  propType?: PropertyType;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minBeds?: String;
  minBaths?: number;
  featured?: boolean;
  search?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}
// ─── Admin Panel specific (kept from original types) ─────────────────────────

// Re-export shorter aliases used throughout the admin panel pages
export type AdminUser  = ApiAdminUser;
export type User       = ApiUser;
export type Property   = ApiProperty;
export type Inquiry    = ApiInquiry;
export type Review     = ApiReview;
export type SupportTicket = ApiSupportTicket;
export type TicketMessage = ApiTicketMessage;
export type Subscriber = ApiNewsletter;
export type InquiryMessage = ApiMessage;
export type SupportStats = SupportTicketStats;

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