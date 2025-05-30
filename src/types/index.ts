export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  propertyType: string;
  status: 'available' | 'sold' | 'pending';
  features: string[];
  images: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  favorites: string[];
  recommendationsReceived: Recommendation[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Recommendation {
  id: string;
  propertyId: string;
  fromUserId: string;
  toUserId: string;
  message?: string;
  createdAt: Date;
}

export interface PropertyFilter {
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  minArea?: number;
  maxArea?: number;
  location?: string;
  status?: 'available' | 'sold' | 'pending';
  features?: string[];
} 