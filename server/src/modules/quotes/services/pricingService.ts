import { PricingOffer } from '../dto/api/quote.dto';

export class PricingService {
  private static readonly PRICE_PER_KW = 1200; // USD per kW
  private static readonly TERMS = [5, 10, 15]; // years
  private static readonly BASE_APR = {
    A: 6.9,
    B: 8.9,
    C: 11.9
  };

  /**
   * Calculate system price based on system size
   */
  static calculateSystemPrice(systemSizeKw: number): number {
    return systemSizeKw * this.PRICE_PER_KW;
  }

  /**
   * Calculate principal amount after down payment
   */
  static calculatePrincipalAmount(systemPrice: number, downPayment: number): number {
    return systemPrice - downPayment;
  }

  /**
   * Determine risk band based on consumption and system size
   */
  static determineRiskBand(monthlyConsumptionKwh: number, systemSizeKw: number): 'A' | 'B' | 'C' {
    if (monthlyConsumptionKwh >= 400 && systemSizeKw <= 6) {
      return 'A';
    } else if (monthlyConsumptionKwh >= 250) {
      return 'B';
    } else {
      return 'C';
    }
  }

  /**
   * Get base APR for risk band
   */
  static getBaseApr(riskBand: 'A' | 'B' | 'C'): number {
    return this.BASE_APR[riskBand];
  }

  /**
   * Calculate monthly payment using standard amortization formula
   * P = Principal, r = monthly interest rate, n = number of payments
   * M = P * [r(1+r)^n] / [(1+r)^n - 1]
   */
  static calculateMonthlyPayment(principal: number, annualRate: number, termYears: number): number {
    const monthlyRate = annualRate / 100 / 12;
    const numberOfPayments = termYears * 12;
    
    if (monthlyRate === 0) {
      return principal / numberOfPayments;
    }
    
    const monthlyPayment = principal * 
      (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    
    return Math.round(monthlyPayment * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Generate all pricing offers for the given parameters
   */
  static generateOffers(principalAmount: number, riskBand: 'A' | 'B' | 'C'): PricingOffer[] {
    const baseApr = this.getBaseApr(riskBand);
    
    return this.TERMS.map(termYears => ({
      termYears,
      apr: baseApr,
      principalUsed: principalAmount,
      monthlyPayment: this.calculateMonthlyPayment(principalAmount, baseApr, termYears)
    }));
  }

  /**
   * Calculate all pricing components for a quote
   */
  static calculateQuotePricing(
    systemSizeKw: number,
    monthlyConsumptionKwh: number,
    downPayment: number,
    currency: string = 'USD'
  ) {
    const systemPrice = this.calculateSystemPrice(systemSizeKw);
    const principalAmount = this.calculatePrincipalAmount(systemPrice, downPayment);
    const riskBand = this.determineRiskBand(monthlyConsumptionKwh, systemSizeKw);
    const baseApr = this.getBaseApr(riskBand);
    const offers = this.generateOffers(principalAmount, riskBand);

    return {
      systemPrice,
      principalAmount,
      riskBand,
      baseApr,
      offers
    };
  }
}
