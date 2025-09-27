import { User } from '../../src/database/models/user.model';
import { Quote } from '../../src/database/models/quote.model';
import { CreateUserRequest } from '../../src/modules/user/dto/api/user.dto';
import { CreateQuoteRequest } from '../../src/modules/quotes/dto/api/quote.dto';
import bcrypt from 'bcrypt';
import { PricingService } from '../../src/modules/quotes/services/pricingService';
import { RolesEnum } from '../../src/modules/user/dto/types';

export class TestHelpers {
  static async createTestUser(userData?: Partial<CreateUserRequest>): Promise<User> {
    const defaultUserData: CreateUserRequest = {
      fullName: 'Test User',
      email: `testuser${Date.now()}@example.com`,
      password: 'password123',
      address: '123 Test St'
    };

    const userToCreate = { ...defaultUserData, ...userData };

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(userToCreate.password, salt);

    return User.create({
      fullName: userToCreate.fullName,
      email: userToCreate.email,
      address: userToCreate.address,
      passwordHash,
      salt,
      roleName: RolesEnum.USER
    });
  }

  static async createTestAdmin(userData?: Partial<CreateUserRequest>): Promise<User> {
    const defaultUserData: CreateUserRequest = {
      fullName: 'Admin User',
      email: `admin${Date.now()}@example.com`,
      password: 'adminpassword',
      address: '456 Admin Ave'
    };

    const userToCreate = { ...defaultUserData, ...userData };

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(userToCreate.password, salt);

    return User.create({
      fullName: userToCreate.fullName,
      email: userToCreate.email,
      address: userToCreate.address,
      passwordHash,
      salt,
      roleName: RolesEnum.ADMIN
    });
  }

  static async createTestQuote(userId: string, quoteData?: Partial<CreateQuoteRequest>): Promise<Quote> {
    const defaultQuoteData: CreateQuoteRequest = {
      systemSizeKw: 5,
      monthlyConsumptionKwh: 500,
      downPayment: 1000,
      currency: 'USD'
    };

    const quoteToCreate = { ...defaultQuoteData, ...quoteData };

    const pricing = PricingService.calculateQuotePricing(
      quoteToCreate.systemSizeKw,
      quoteToCreate.monthlyConsumptionKwh,
      quoteToCreate.downPayment,
      quoteToCreate.currency || 'USD'
    );

    return Quote.create({
      userId,
      systemSizeKw: quoteToCreate.systemSizeKw,
      monthlyConsumptionKwh: quoteToCreate.monthlyConsumptionKwh,
      downPayment: quoteToCreate.downPayment,
      currency: quoteToCreate.currency || 'USD',
      systemPrice: pricing.systemPrice,
      principalAmount: pricing.principalAmount,
      riskBand: pricing.riskBand,
      baseApr: pricing.baseApr,
      offers: pricing.offers
    });
  }

  static async clearDatabase(): Promise<void> {
    await Quote.destroy({ truncate: true, cascade: true });
    await User.destroy({ truncate: true, cascade: true });
  }
}
