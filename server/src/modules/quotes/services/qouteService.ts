import { Quote } from '../../../database/models/quote.model';
import { User } from '../../../database/models/user.model';
import { 
  CreateQuoteRequest, 
  QuoteResponse,
  QuoteWithAuthorResponse 
} from '../dto/api/quote.dto';
import { PricingService } from './pricingService';
import { logger } from '../../../logger';
import { RolesEnum } from '../../user/dto/types';

export class QuoteService {
  async getAllQuotes(userId: string, page: number = 1, limit: number = 10, roleName?: string): Promise<{ quotes: QuoteResponse[], totalCount: number, totalPages: number, currentPage: number }> {
    try {
      const offset = (page - 1) * limit;
      
      // If user is ADMIN, don't filter by userId (show all quotes)
      // Otherwise, filter by userId (show only user's quotes)
      const whereClause = roleName === RolesEnum.ADMIN ? {} : { userId };
      
      const { count, rows: quotes } = await Quote.findAndCountAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'author',
          attributes: ['id', 'fullName', 'email', 'address']
        }],
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });
      
      const totalPages = Math.ceil(count / limit);
      
      return {
        quotes: quotes.map(quote => ({
          id: quote.id,
          userId: quote.userId,
          systemSizeKw: quote.systemSizeKw,
          monthlyConsumptionKwh: quote.monthlyConsumptionKwh,
          downPayment: quote.downPayment,
          currency: quote.currency,
          systemPrice: quote.systemPrice,
          principalAmount: quote.principalAmount,
          riskBand: quote.riskBand,
          baseApr: quote.baseApr,
          offers: quote.offers,
          fullName: (quote as any).author.fullName,
          email: (quote as any).author.email,
          address: (quote as any).author.address,
          createdAt: quote.createdAt,
          updatedAt: quote.updatedAt
        })),
        totalCount: count,
        totalPages,
        currentPage: page
      };
    } catch (error) {
      logger.error('Error fetching all quotes', { error });
      throw error;
    }
  }

  async getQuoteById(id: string, userId: string): Promise<QuoteWithAuthorResponse | null> {
    try {
      const quote = await Quote.findOne({
        where: { id, userId },
        include: [{
          model: User,
          as: 'author',
          attributes: ['id', 'fullName', 'email', 'address']
        }]
      });
      
      if (!quote) {
        return null;
      }

      return {
        id: quote.id,
        userId: quote.userId,
        systemSizeKw: quote.systemSizeKw,
        monthlyConsumptionKwh: quote.monthlyConsumptionKwh,
        downPayment: quote.downPayment,
        currency: quote.currency,
        systemPrice: quote.systemPrice,
        principalAmount: quote.principalAmount,
        riskBand: quote.riskBand,
        baseApr: quote.baseApr,
        offers: quote.offers,
        fullName: (quote as any).author.fullName,
        email: (quote as any).author.email,
        address: (quote as any).author.address,
        author: {
          id: (quote as any).author.id,
          fullName: (quote as any).author.fullName,
          email: (quote as any).author.email
        },
        createdAt: quote.createdAt,
        updatedAt: quote.updatedAt
      };
    } catch (error) {
      logger.error('Error fetching quote by ID', { error, quoteId: id });
      throw error;
    }
  }

  async createQuote(data: CreateQuoteRequest & { userId: string }): Promise<QuoteResponse> {
    try {
      // Calculate pricing using the pricing service
      const pricing = PricingService.calculateQuotePricing(
        data.systemSizeKw,
        data.monthlyConsumptionKwh,
        data.downPayment,
        data.currency || 'USD'
      );

      const quote = await Quote.create({
        userId: data.userId,
        systemSizeKw: data.systemSizeKw,
        monthlyConsumptionKwh: data.monthlyConsumptionKwh,
        downPayment: data.downPayment,
        currency: data.currency || 'USD',
        systemPrice: pricing.systemPrice,
        principalAmount: pricing.principalAmount,
        riskBand: pricing.riskBand,
        baseApr: pricing.baseApr,
        offers: pricing.offers
      });

      // Get user details for response
      const user = await User.findByPk(data.userId);
      if (!user) {
        throw new Error('User not found');
      }

      return {
        id: quote.id,
        userId: quote.userId,
        systemSizeKw: quote.systemSizeKw,
        monthlyConsumptionKwh: quote.monthlyConsumptionKwh,
        downPayment: quote.downPayment,
        currency: quote.currency,
        systemPrice: quote.systemPrice,
        principalAmount: quote.principalAmount,
        riskBand: quote.riskBand,
        baseApr: quote.baseApr,
        offers: quote.offers,
        fullName: user.fullName,
        email: user.email,
        address: user.address,
        createdAt: quote.createdAt,
        updatedAt: quote.updatedAt
      };
    } catch (error) {
      logger.error('Error creating quote', { error, data });
      throw error;
    }
  }

}