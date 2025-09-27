import { Request, Response } from 'express';
import { QuoteService, GetAllQuotesParams } from "../services/qouteService";
import { 
  CreateQuoteRequest
} from '../dto/api/quote.dto';
import { logger, logError, logBusinessEvent, LogContext } from '../../../logger';

export class QuoteController {
  constructor(private quoteService: QuoteService) {}

  async getAllQuotes(req: Request, res: Response): Promise<void> {
    const requestId = (req as any).requestId;
    const logContext: LogContext = { requestId, method: 'getAllQuotes' };
    
    try {
      // Get userId and roleName from authenticated user
      const userId = req.user?.userId;
      const roleName = req.user?.roleName;
      
      
      if (!userId) {
        logger.warn('Get quotes failed - user not authenticated', logContext);
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }
      
      // Parse pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      // Parse search parameters (only for admin users)
      const searchName = req.query.searchName as string;
      const searchEmail = req.query.searchEmail as string;
      const view = req.query.view as string;
      
      // Validate pagination parameters
      if (page < 1) {
        logger.warn('Invalid pagination - page must be greater than 0', {
          ...logContext,
          page,
          limit
        });
        res.status(400).json({ error: 'Page must be greater than 0' });
        return;
      }
      
      if (limit < 1 || limit > 100) {
        logger.warn('Invalid pagination - limit out of range', {
          ...logContext,
          page,
          limit
        });
        res.status(400).json({ error: 'Limit must be between 1 and 100' });
        return;
      }
      
      // Validate search parameters - only admin users can search when admin view is enabled
      if ((searchName || searchEmail || view === 'ADMIN') && roleName !== 'ADMIN') {
        logger.warn('Unauthorized admin functionality access attempt', {
          ...logContext,
          roleName,
          searchName,
          searchEmail,
          view
        });
        res.status(403).json({ error: 'Admin functionality is only available for admin users' });
        return;
      }
      
      // If user is ADMIN, allow viewing all quotes with optional search; otherwise filter by userId
      const params: GetAllQuotesParams = {
        userId,
        page,
        limit,
        roleName,
        searchName,
        searchEmail,
        view
      };
      
      const result = await this.quoteService.getAllQuotes(params);
      
      logBusinessEvent('quotes_retrieved', {
        ...logContext,
        userId,
        roleName,
        totalCount: result.totalCount,
        currentPage: result.currentPage,
        isAdminView: view === 'ADMIN',
        hasSearch: !!(searchName || searchEmail)
      });
      
      res.status(200).json(result);
    } catch (error) {
      logError(error as Error, {
        ...logContext,
        userId: req.user?.userId,
        operation: 'get_all_quotes'
      });
      res.status(500).json({ error: 'Failed to fetch quotes' });
    }
  }

  async getQuoteById(req: Request, res: Response): Promise<void> {
    const requestId = (req as any).requestId;
    const { id } = req.params;
    const logContext: LogContext = { requestId, method: 'getQuoteById', quoteId: id };
    
    try {
      // Get userId from authenticated user
      const userId = req.user?.userId;
      
      
      if (!userId) {
        logger.warn('Get quote failed - user not authenticated', logContext);
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }
      
      const quote = await this.quoteService.getQuoteById(id, userId);
      
      if (!quote) {
        logger.warn('Quote not found', {
          ...logContext,
          userId
        });
        res.status(404).json({ error: 'Quote not found' });
        return;
      }


      res.status(200).json(quote);
    } catch (error) {
      logError(error as Error, {
        ...logContext,
        userId: req.user?.userId,
        operation: 'get_quote_by_id'
      });
      res.status(500).json({ error: 'Failed to fetch quote' });
    }
  }

  async createQuote(req: Request, res: Response): Promise<void> {
    const requestId = (req as any).requestId;
    const logContext: LogContext = { requestId, method: 'createQuote' };
    
    try {
      const quoteData: CreateQuoteRequest = req.body;
      
      // Get userId from authenticated user
      const userId = req.user?.userId;
      
      
      if (!userId) {
        logger.warn('Create quote failed - user not authenticated', logContext);
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }
      
      // Basic validation
      if (!quoteData.systemSizeKw || !quoteData.monthlyConsumptionKwh) {
        logger.warn('Create quote validation failed - missing required fields', {
          ...logContext,
          userId,
          hasSystemSize: !!quoteData.systemSizeKw,
          hasMonthlyConsumption: !!quoteData.monthlyConsumptionKwh
        });
        res.status(400).json({ error: 'systemSizeKw and monthlyConsumptionKwh are required' });
        return;
      }

      if (quoteData.systemSizeKw <= 0 || quoteData.monthlyConsumptionKwh <= 0) {
        logger.warn('Create quote validation failed - invalid values', {
          ...logContext,
          userId,
          systemSizeKw: quoteData.systemSizeKw,
          monthlyConsumptionKwh: quoteData.monthlyConsumptionKwh
        });
        res.status(400).json({ error: 'systemSizeKw and monthlyConsumptionKwh must be positive' });
        return;
      }

      // Validate downPayment if provided
      if (quoteData.downPayment !== undefined && quoteData.downPayment < 0) {
        logger.warn('Create quote validation failed - negative down payment', {
          ...logContext,
          userId,
          downPayment: quoteData.downPayment
        });
        res.status(400).json({ error: 'downPayment must be non-negative' });
        return;
      }

      // Add userId from authenticated user to quote data
      const quoteDataWithUserId = { ...quoteData, userId };
      const quote = await this.quoteService.createQuote(quoteDataWithUserId);
      
      logBusinessEvent('quote_created', {
        ...logContext,
        userId,
        quoteId: quote.id,
        systemSizeKw: quote.systemSizeKw,
        systemPrice: quote.systemPrice,
        riskBand: quote.riskBand
      });
      
      res.status(201).json(quote);
    } catch (error) {
      logError(error as Error, {
        ...logContext,
        userId: req.user?.userId,
        operation: 'create_quote',
        quoteData: req.body
      });
      res.status(500).json({ error: 'Failed to create quote' });
    }
  }

}