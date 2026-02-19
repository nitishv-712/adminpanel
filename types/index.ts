export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'buyer' | 'seller' | 'agent' | 'admin';
  avatar?: string;
  isVerified: boolean;
  createdAt: string;
}

export interface Property {
  _id: string;
  title: string;
  description?: string;
  listingType: 'sale' | 'rent';
  propertyType: string;
  status: 'pending' | 'active' | 'sold' | 'rented' | 'archived';
  badge?: string | null;
  price: number;
  address: {
    street?: string;
    city: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  yearBuilt?: number;
  images: { url: string; isPrimary: boolean }[];
  owner: User | string;
  isFeatured: boolean;
  views: number;
  saves: number;
  inquiries: number;
  createdAt: string;
}

export interface Inquiry {
  _id: string;
  property: Property | string;
  sender?: User | null;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'closed';
  createdAt: string;
}

export interface Subscriber {
  _id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

export interface Stats {
  totals: { users: number; properties: number; inquiries: number; subscribers: number };
  properties: { pending: number; active: number; forSale: number; forRent: number };
  users: { buyers: number; sellers: number; agents: number };
  engagement: { totalViews: number };
  recentUsers: User[];
  recentProperties: Property[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
