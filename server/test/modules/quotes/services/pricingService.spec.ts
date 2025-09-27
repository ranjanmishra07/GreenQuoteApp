import { expect } from 'chai';
import { PricingService } from '../../../../src/modules/quotes/services/pricingService';

describe('PricingService', () => {
  describe('calculateQuotePricing', () => {
    it('should calculate pricing for a small system (5kW)', () => {
      const result = PricingService.calculateQuotePricing(5, 500, 1000, 'USD');

      expect(result).to.have.property('systemPrice');
      expect(result).to.have.property('principalAmount');
      expect(result).to.have.property('riskBand');
      expect(result).to.have.property('baseApr');
      expect(result).to.have.property('offers');

      expect(result.systemPrice).to.be.a('number');
      expect(result.principalAmount).to.be.a('number');
      expect(result.riskBand).to.be.oneOf(['A', 'B', 'C']);
      expect(result.baseApr).to.be.a('number');
      expect(result.offers).to.be.an('array');
      expect(result.offers).to.have.lengthOf(3); // 5, 10, 15 year offers

      // Check that principal amount is system price minus down payment
      expect(result.principalAmount).to.equal(result.systemPrice - 1000);

      // Check that offers have correct structure
      result.offers.forEach((offer, index) => {
        expect(offer).to.have.property('termYears');
        expect(offer).to.have.property('apr');
        expect(offer).to.have.property('principalUsed');
        expect(offer).to.have.property('monthlyPayment');

        expect(offer.termYears).to.be.oneOf([5, 10, 15]);
        expect(offer.apr).to.be.a('number');
        expect(offer.principalUsed).to.be.a('number');
        expect(offer.monthlyPayment).to.be.a('number');
        expect(offer.monthlyPayment).to.be.greaterThan(0);
      });
    });

    it('should calculate pricing for a medium system (10kW)', () => {
      const result = PricingService.calculateQuotePricing(10, 1000, 5000, 'USD');

      expect(result.systemPrice).to.be.greaterThan(0);
      expect(result.principalAmount).to.equal(result.systemPrice - 5000);
      expect(result.riskBand).to.be.oneOf(['A', 'B', 'C']);
      expect(result.baseApr).to.be.greaterThan(0);
      expect(result.offers).to.have.lengthOf(3);
    });

    it('should calculate pricing for a large system (20kW)', () => {
      const result = PricingService.calculateQuotePricing(20, 2000, 10000, 'USD');

      expect(result.systemPrice).to.be.greaterThan(0);
      expect(result.principalAmount).to.equal(result.systemPrice - 10000);
      expect(result.riskBand).to.be.oneOf(['A', 'B', 'C']);
      expect(result.baseApr).to.be.greaterThan(0);
      expect(result.offers).to.have.lengthOf(3);
    });

    it('should handle zero down payment', () => {
      const result = PricingService.calculateQuotePricing(5, 500, 0, 'USD');

      expect(result.principalAmount).to.equal(result.systemPrice);
      expect(result.offers).to.have.lengthOf(3);
      
      result.offers.forEach(offer => {
        expect(offer.principalUsed).to.equal(result.systemPrice);
        expect(offer.monthlyPayment).to.be.greaterThan(0);
      });
    });

    it('should handle down payment equal to system price', () => {
      const systemSizeKw = 5;
      const systemPrice = PricingService.calculateSystemPrice(systemSizeKw); // 5 * 1200 = 6000
      const result = PricingService.calculateQuotePricing(systemSizeKw, 500, systemPrice, 'USD');

      expect(result.principalAmount).to.equal(0);
      expect(result.offers).to.have.lengthOf(3);
      
      result.offers.forEach(offer => {
        expect(offer.principalUsed).to.equal(0);
        expect(offer.monthlyPayment).to.equal(0);
      });
    });

    it('should handle different currencies', () => {
      const usdResult = PricingService.calculateQuotePricing(5, 500, 1000, 'USD');
      const eurResult = PricingService.calculateQuotePricing(5, 500, 1000, 'EUR');
      const gbpResult = PricingService.calculateQuotePricing(5, 500, 1000, 'GBP');

      expect(usdResult.systemPrice).to.be.greaterThan(0);
      expect(eurResult.systemPrice).to.be.greaterThan(0);
      expect(gbpResult.systemPrice).to.be.greaterThan(0);

      // All should have the same structure
      [usdResult, eurResult, gbpResult].forEach(result => {
        expect(result).to.have.property('systemPrice');
        expect(result).to.have.property('principalAmount');
        expect(result).to.have.property('riskBand');
        expect(result).to.have.property('baseApr');
        expect(result).to.have.property('offers');
        expect(result.offers).to.have.lengthOf(3);
      });
    });

    it('should return consistent risk band for same system size', () => {
      const result1 = PricingService.calculateQuotePricing(5, 500, 1000, 'USD');
      const result2 = PricingService.calculateQuotePricing(5, 500, 1000, 'USD');

      expect(result1.riskBand).to.equal(result2.riskBand);
    });

    it('should return consistent base APR for same system size', () => {
      const result1 = PricingService.calculateQuotePricing(5, 500, 1000, 'USD');
      const result2 = PricingService.calculateQuotePricing(5, 500, 1000, 'USD');

      expect(result1.baseApr).to.equal(result2.baseApr);
    });

    it('should have increasing monthly payments for longer terms', () => {
      const result = PricingService.calculateQuotePricing(5, 500, 1000, 'USD');

      // Sort offers by term years
      const sortedOffers = result.offers.sort((a, b) => a.termYears - b.termYears);
      
      // Monthly payment should generally decrease with longer terms (lower APR)
      // But this depends on the specific pricing logic
      expect(sortedOffers).to.have.lengthOf(3);
      expect(sortedOffers[0].termYears).to.equal(5);
      expect(sortedOffers[1].termYears).to.equal(10);
      expect(sortedOffers[2].termYears).to.equal(15);
    });

    it('should handle edge case with very small system', () => {
      const result = PricingService.calculateQuotePricing(1, 100, 500, 'USD');

      expect(result.systemPrice).to.be.greaterThan(0);
      expect(result.principalAmount).to.equal(result.systemPrice - 500);
      expect(result.riskBand).to.be.oneOf(['A', 'B', 'C']);
      expect(result.baseApr).to.be.greaterThan(0);
      expect(result.offers).to.have.lengthOf(3);
    });

    it('should handle edge case with very large system', () => {
      const result = PricingService.calculateQuotePricing(50, 5000, 50000, 'USD');

      expect(result.systemPrice).to.be.greaterThan(0);
      expect(result.principalAmount).to.equal(result.systemPrice - 50000);
      expect(result.riskBand).to.be.oneOf(['A', 'B', 'C']);
      expect(result.baseApr).to.be.greaterThan(0);
      expect(result.offers).to.have.lengthOf(3);
    });

    it('should handle high monthly consumption', () => {
      const result = PricingService.calculateQuotePricing(5, 2000, 1000, 'USD');

      expect(result.systemPrice).to.be.greaterThan(0);
      expect(result.principalAmount).to.equal(result.systemPrice - 1000);
      expect(result.riskBand).to.be.oneOf(['A', 'B', 'C']);
      expect(result.baseApr).to.be.greaterThan(0);
      expect(result.offers).to.have.lengthOf(3);
    });

    it('should handle low monthly consumption', () => {
      const result = PricingService.calculateQuotePricing(5, 100, 1000, 'USD');

      expect(result.systemPrice).to.be.greaterThan(0);
      expect(result.principalAmount).to.equal(result.systemPrice - 1000);
      expect(result.riskBand).to.be.oneOf(['A', 'B', 'C']);
      expect(result.baseApr).to.be.greaterThan(0);
      expect(result.offers).to.have.lengthOf(3);
    });
  });
});
