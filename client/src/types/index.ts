// User types
export interface User {
  id: string;
  fullName: string;
  email: string;
  roleName: 'USER' | 'ADMIN';
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  userId: string;
  email: string;
  roleName: 'USER' | 'ADMIN';
  iat: number;
  exp: number;
}

// Quote types
export interface QuoteOffer {
  termYears: number;
  apr: number;
  principalUsed: number;
  monthlyPayment: number;
}

export interface Quote {
  id: string;
  userId: string;
  systemSizeKw: number;
  monthlyConsumptionKwh: number;
  downPayment: number;
  currency: string;
  systemPrice: number;
  principalAmount: number;
  riskBand: string;
  baseApr: number;
  offers: QuoteOffer[];
  fullName: string;
  email: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
  author?: User;
}


export interface QuoteListResponse {
  quotes: Quote[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}


export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: User;
  };
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
