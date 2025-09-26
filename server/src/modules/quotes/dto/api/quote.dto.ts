// Quote Pricing DTOs
export interface CreateQuoteRequest {
  systemSizeKw: number;
  monthlyConsumptionKwh: number;
  downPayment: number;
  currency?: string; // Default to USD
}


export interface PricingOffer {
  termYears: number;
  apr: number;
  principalUsed: number;
  monthlyPayment: number;
}

export interface QuoteResponse {
  id: string;
  userId: string;
  systemSizeKw: number;
  monthlyConsumptionKwh: number;
  downPayment: number;
  currency: string;
  systemPrice: number;
  principalAmount: number;
  riskBand: 'A' | 'B' | 'C';
  baseApr: number;
  offers: PricingOffer[];
  // User details from JWT
  fullName: string;
  email: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuoteWithAuthorResponse {
  id: string;
  userId: string;
  systemSizeKw: number;
  monthlyConsumptionKwh: number;
  downPayment: number;
  currency: string;
  systemPrice: number;
  principalAmount: number;
  riskBand: 'A' | 'B' | 'C';
  baseApr: number;
  offers: PricingOffer[];
  // User details from JWT
  fullName: string;
  email: string;
  address?: string;
  author: {
    id: string;
    fullName: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
