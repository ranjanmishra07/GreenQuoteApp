import { Request, Response } from 'express';
import { QuoteService } from "../services/qouteService";
import { 
  CreateQuoteRequest, 
  QuoteResponse,
  QuoteWithAuthorResponse
} from '../dto/api/quote.dto';
import { logger } from '../../../logger';

export class QuoteController {
  constructor(private quoteService: QuoteService) {}

  async getAllQuotes(req: Request, res: Response): Promise<void> {
    try {
      // Get userId and roleName from authenticated user
      const userId = req.user?.userId;
      const roleName = req.user?.roleName;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }
      
      // Parse pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      // Validate pagination parameters
      if (page < 1) {
        res.status(400).json({ error: 'Page must be greater than 0' });
        return;
      }
      
      if (limit < 1 || limit > 100) {
        res.status(400).json({ error: 'Limit must be between 1 and 100' });
        return;
      }
      
      // If user is ADMIN, allow viewing all quotes; otherwise filter by userId
      const result = await this.quoteService.getAllQuotes(userId, page, limit, roleName);
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error fetching quotes', { error });
      res.status(500).json({ error: 'Failed to fetch quotes' });
    }
  }

  async getQuoteById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Get userId from authenticated user
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }
      
      const quote = await this.quoteService.getQuoteById(id, userId);
      
      if (!quote) {
        res.status(404).json({ error: 'Quote not found' });
        return;
      }

      res.status(200).json(quote);
    } catch (error) {
      logger.error('Error fetching quote by ID', { error, id: req.params.id });
      res.status(500).json({ error: 'Failed to fetch quote' });
    }
  }

  async createQuote(req: Request, res: Response): Promise<void> {
    try {
      const quoteData: CreateQuoteRequest = req.body;
      
      // Get userId from authenticated user
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }
      
      // Basic validation
      if (!quoteData.systemSizeKw || !quoteData.monthlyConsumptionKwh || !quoteData.downPayment) {
        res.status(400).json({ error: 'systemSizeKw, monthlyConsumptionKwh, and downPayment are required' });
        return;
      }

      if (quoteData.systemSizeKw <= 0 || quoteData.monthlyConsumptionKwh <= 0 || quoteData.downPayment < 0) {
        res.status(400).json({ error: 'systemSizeKw and monthlyConsumptionKwh must be positive, downPayment must be non-negative' });
        return;
      }

      // Add userId from authenticated user to quote data
      const quoteDataWithUserId = { ...quoteData, userId };
      const quote = await this.quoteService.createQuote(quoteDataWithUserId);
      res.status(201).json(quote);
    } catch (error) {
      logger.error('Error creating quote', { error, body: req.body });
      res.status(400).json({ error: 'Failed to create quote' });
    }
  }

}