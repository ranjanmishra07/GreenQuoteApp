import { Quote } from '../../../database/models/quote.model';
import { User } from '../../../database/models/user.model';
import { 
  CreateQuoteRequest, 
  QuoteResponse,
  QuoteWithAuthorResponse 
} from '../dto/api/quote.dto';
import { PricingService } from './pricingService';
import { logger, logError, LogContext } from '../../../logger';
import { RolesEnum } from '../../user/dto/types';
import { Op } from 'sequelize';

export interface GetAllQuotesParams {
  userId: string;
  page?: number;
  limit?: number;
  roleName?: string;
  searchName?: string;
  searchEmail?: string;
  view?: string;
}

export class QuoteService {
  async getAllQuotes(params: GetAllQuotesParams): Promise<{ quotes: QuoteResponse[], totalCount: number, totalPages: number, currentPage: number }> {
    const logContext: LogContext = { 
      service: 'QuoteService', 
      method: 'getAllQuotes',
      userId: params.userId,
      page: params.page,
      limit: params.limit
    };
    
    try {
      const { userId, page = 1, limit = 10, roleName, searchName, searchEmail, view } = params;
      const offset = (page - 1) * limit;
      
      
      // Determine if admin view is enabled
      const isAdminView = roleName === RolesEnum.ADMIN && view === 'ADMIN';
      
      // If admin view is enabled, don't filter by userId (show all quotes)
      // Otherwise, filter by userId (show only user's quotes)
      const whereClause = isAdminView ? {} : { userId };
      
      // Build include clause with search filters for admin users
      const includeClause: any = {
        model: User,
        as: 'author',
        attributes: ['id', 'fullName', 'email', 'address']
      };
      
      // Add search filters for admin users only when admin view is enabled
      if (isAdminView && (searchName || searchEmail)) {
        const authorWhere: any = {};
        
        if (searchName) {
          authorWhere.fullName = {
            [Op.iLike]: `%${searchName}%`
          };
        }
        
        if (searchEmail) {
          authorWhere.email = {
            [Op.iLike]: `%${searchEmail}%`
          };
        }
        
        includeClause.where = authorWhere;
      }
      
      const { count, rows: quotes } = await Quote.findAndCountAll({
        where: whereClause,
        include: [includeClause],
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
      logError(error as Error, {
        ...logContext,
        operation: 'get_all_quotes'
      });
      throw error;
    }
  }

  async getQuoteById(id: string, userId: string): Promise<QuoteWithAuthorResponse | null> {
    const logContext: LogContext = { 
      service: 'QuoteService', 
      method: 'getQuoteById',
      quoteId: id,
      userId 
    };
    
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
        logger.warn('Quote not found', logContext);
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
      logError(error as Error, {
        ...logContext,
        operation: 'get_quote_by_id'
      });
      throw error;
    }
  }

  async createQuote(data: CreateQuoteRequest & { userId: string }): Promise<QuoteResponse> {
    const logContext: LogContext = { 
      service: 'QuoteService', 
      method: 'createQuote',
      userId: data.userId,
      systemSizeKw: data.systemSizeKw,
      monthlyConsumptionKwh: data.monthlyConsumptionKwh
    };
    
    try {
      // Set default downPayment to 0 if not provided
      const downPayment = data.downPayment ?? 0;
      
      // Calculate pricing using the pricing service
      const pricing = PricingService.calculateQuotePricing(
        data.systemSizeKw,
        data.monthlyConsumptionKwh,
        downPayment,
        data.currency || 'USD'
      );

      const quote = await Quote.create({
        userId: data.userId,
        systemSizeKw: data.systemSizeKw,
        monthlyConsumptionKwh: data.monthlyConsumptionKwh,
        downPayment: downPayment,
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
        logger.error('User not found during quote creation', logContext);
        throw new Error('User not found');
      }

      logger.info('Quote created successfully', {
        ...logContext,
        quoteId: quote.id,
        systemPrice: quote.systemPrice,
        riskBand: quote.riskBand,
        userEmail: user.email
      });

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
      logError(error as Error, {
        ...logContext,
        operation: 'create_quote',
        quoteData: data
      });
      throw error;
    }
  }

}