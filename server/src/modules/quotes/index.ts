import { Router } from 'express';
import { QuoteService } from './services/qouteService';
import { QuoteController } from './controllers/qouteController';
import { authenticateToken } from '../user/middleware/jwt';

export function createQuoteRouter(): Router {
  const router = Router();
  
  // Initialize dependencies
  const quoteService = new QuoteService();
  const quoteController = new QuoteController(quoteService);

      // All routes are protected - require valid JWT
      router.get('/', authenticateToken, (req, res) => quoteController.getAllQuotes(req, res));
      router.get('/:id', authenticateToken, (req, res) => quoteController.getQuoteById(req, res));
      router.post('/', authenticateToken, (req, res) => quoteController.createQuote(req, res));

  return router;
}

// Export for dependency injection if needed
export { QuoteService, QuoteController };
