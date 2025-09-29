import { expect } from 'chai';
import { QuoteController } from '../../../../src/modules/quotes/controllers/qouteController';
import { QuoteService } from '../../../../src/modules/quotes/services/qouteService';
import { CreateQuoteRequest, QuoteResponse, QuoteWithAuthorResponse } from '../../../../src/modules/quotes/dto/api/quote.dto';
import '../../../../src/modules/user/middleware/jwt'; // Import to load type declarations
import * as sinon from 'sinon';

describe('QuoteController Unit Tests', () => {
  let quoteController: QuoteController;
  let mockQuoteService: sinon.SinonStubbedInstance<QuoteService>;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    // Create a stubbed QuoteService
    mockQuoteService = sinon.createStubInstance(QuoteService);
    
    // Create QuoteController with mocked service
    quoteController = new QuoteController(mockQuoteService as any);
    
    // Setup mock request and response
    mockRequest = {
      user: {
        userId: 'test-user-id',
        roleName: 'USER',
        fullName: 'Test User',
        email: 'test@example.com'
      },
      query: {},
      params: {},
      body: {},
      requestId: 'test-request-id'
    } as any;

    mockResponse = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis()
    };

    // Reset service stubs only
    mockQuoteService.getAllQuotes.reset();
    mockQuoteService.getQuoteById.reset();
    mockQuoteService.createQuote.reset();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getAllQuotes', () => {
    it('should return quotes successfully for regular user', async () => {
      // Arrange
      const mockQuotes = {
        quotes: [
          {
            id: 'quote-1',
            userId: 'test-user-id',
            systemSizeKw: 6,
            monthlyConsumptionKwh: 550,
            downPayment: 1200,
            currency: 'USD',
            systemPrice: 7200,
            principalAmount: 6000,
            riskBand: 'A' as 'A' | 'B' | 'C',
            baseApr: 6.9,
            offers: [] as any[],
            fullName: 'Test User',
            email: 'test@example.com',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        totalCount: 1,
        totalPages: 1,
        currentPage: 1
      };

      mockQuoteService.getAllQuotes.resolves(mockQuotes);

      // Act
      await quoteController.getAllQuotes(mockRequest, mockResponse);

      // Assert
      expect(mockQuoteService.getAllQuotes.calledOnce).to.be.true;
      expect(mockResponse.status).to.have.been.calledWith(200);
      expect(mockResponse.json).to.have.been.calledWith(mockQuotes);
    });

    it('should return 401 when user is not authenticated', async () => {
      // Arrange
      mockRequest.user = undefined;

      // Act
      await quoteController.getAllQuotes(mockRequest, mockResponse);

      // Assert
      expect(mockQuoteService.getAllQuotes.called).to.be.false;
      expect(mockResponse.status).to.have.been.calledWith(401);
      expect(mockResponse.json).to.have.been.calledWith({ error: 'User not authenticated' });
    });


    it('should return 400 for invalid limit parameter (too high)', async () => {
      // Arrange
      mockRequest.query = { limit: '101' };

      // Act
      await quoteController.getAllQuotes(mockRequest, mockResponse);

      // Assert
      expect(mockQuoteService.getAllQuotes.called).to.be.false;
      expect(mockResponse.status).to.have.been.calledWith(400);
      expect(mockResponse.json).to.have.been.calledWith({ error: 'Limit must be between 1 and 100' });
    });

    it('should return 403 when non-admin user tries to use admin functionality', async () => {
      // Arrange
      mockRequest.query = { searchName: 'test', view: 'ADMIN' };

      // Act
      await quoteController.getAllQuotes(mockRequest, mockResponse);

      // Assert
      expect(mockQuoteService.getAllQuotes.called).to.be.false;
      expect(mockResponse.status).to.have.been.calledWith(403);
      expect(mockResponse.json).to.have.been.calledWith({ 
        error: 'Admin functionality is only available for admin users' 
      });
    });

    it('should allow admin user to use admin functionality', async () => {
      // Arrange
      mockRequest.user!.roleName = 'ADMIN';
      mockRequest.query = { searchName: 'test', view: 'ADMIN' };
      
      const mockQuotes = {
        quotes: [] as any[],
        totalCount: 0,
        totalPages: 0,
        currentPage: 1
      };
      mockQuoteService.getAllQuotes.resolves(mockQuotes);

      // Act
      await quoteController.getAllQuotes(mockRequest, mockResponse);

      // Assert
      expect(mockQuoteService.getAllQuotes.calledOnce).to.be.true;
      expect(mockResponse.status).to.have.been.calledWith(200);
      expect(mockResponse.json).to.have.been.calledWith(mockQuotes);
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockQuoteService.getAllQuotes.rejects(error);

      // Act
      await quoteController.getAllQuotes(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).to.have.been.calledWith(500);
      expect(mockResponse.json).to.have.been.calledWith({ error: 'Failed to fetch quotes' });
    });

    it('should pass correct parameters to service', async () => {
      // Arrange
      mockRequest.query = { 
        page: '2', 
        limit: '5', 
        searchName: 'john', 
        searchEmail: 'john@example.com',
        view: 'ADMIN'
      };
      mockRequest.user!.roleName = 'ADMIN';
      
      const mockQuotes = {
        quotes: [] as any[],
        totalCount: 0,
        totalPages: 0,
        currentPage: 2
      };
      mockQuoteService.getAllQuotes.resolves(mockQuotes);

      // Act
      await quoteController.getAllQuotes(mockRequest, mockResponse);

      // Assert
      expect(mockQuoteService.getAllQuotes.calledOnce).to.be.true;
      const serviceCall = mockQuoteService.getAllQuotes.getCall(0);
      const params = serviceCall.args[0];
      
      expect(params.userId).to.equal('test-user-id');
      expect(params.page).to.equal(2);
      expect(params.limit).to.equal(5);
      expect(params.roleName).to.equal('ADMIN');
      expect(params.searchName).to.equal('john');
      expect(params.searchEmail).to.equal('john@example.com');
      expect(params.view).to.equal('ADMIN');
    });
  });

  describe('getQuoteById', () => {
    it('should return quote successfully', async () => {
      // Arrange
      const quoteId = 'quote-123';
      mockRequest.params = { id: quoteId };
      
      const mockQuote: QuoteWithAuthorResponse = {
        id: quoteId,
        userId: 'test-user-id',
        systemSizeKw: 6,
        monthlyConsumptionKwh: 550,
        downPayment: 1200,
        currency: 'USD',
        systemPrice: 7200,
        principalAmount: 6000,
        riskBand: 'A',
        baseApr: 6.9,
        offers: [],
        fullName: 'Test User',
        email: 'test@example.com',
        author: {
          id: 'test-user-id',
          fullName: 'Test User',
          email: 'test@example.com'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockQuoteService.getQuoteById.resolves(mockQuote);

      // Act
      await quoteController.getQuoteById(mockRequest, mockResponse);

      // Assert
      expect(mockQuoteService.getQuoteById.calledOnce).to.be.true;
      expect(mockQuoteService.getQuoteById.calledWith(quoteId, 'test-user-id')).to.be.true;
      expect(mockResponse.status).to.have.been.calledWith(200);
      expect(mockResponse.json).to.have.been.calledWith(mockQuote);
    });

    it('should return 401 when user is not authenticated', async () => {
      // Arrange
      mockRequest.user = undefined;
      mockRequest.params = { id: 'quote-123' };

      // Act
      await quoteController.getQuoteById(mockRequest, mockResponse);

      // Assert
      expect(mockQuoteService.getQuoteById.called).to.be.false;
      expect(mockResponse.status).to.have.been.calledWith(401);
      expect(mockResponse.json).to.have.been.calledWith({ error: 'User not authenticated' });
    });

    it('should return 404 when quote is not found', async () => {
      // Arrange
      const quoteId = 'non-existent-quote';
      mockRequest.params = { id: quoteId };
      mockQuoteService.getQuoteById.resolves(null);

      // Act
      await quoteController.getQuoteById(mockRequest, mockResponse);

      // Assert
      expect(mockQuoteService.getQuoteById.calledOnce).to.be.true;
      expect(mockResponse.status).to.have.been.calledWith(404);
      expect(mockResponse.json).to.have.been.calledWith({ error: 'Quote not found' });
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      const quoteId = 'quote-123';
      mockRequest.params = { id: quoteId };
      const error = new Error('Database connection failed');
      mockQuoteService.getQuoteById.rejects(error);

      // Act
      await quoteController.getQuoteById(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).to.have.been.calledWith(500);
      expect(mockResponse.json).to.have.been.calledWith({ error: 'Failed to fetch quote' });
    });
  });

  describe('createQuote', () => {
    it('should create quote successfully', async () => {
      // Arrange
      const quoteData: CreateQuoteRequest = {
        systemSizeKw: 8,
        monthlyConsumptionKwh: 650,
        downPayment: 5000,
        currency: 'USD'
      };
      mockRequest.body = quoteData;

      const mockCreatedQuote: QuoteResponse = {
        id: 'new-quote-id',
        userId: 'test-user-id',
        systemSizeKw: 8,
        monthlyConsumptionKwh: 650,
        downPayment: 5000,
        currency: 'USD',
        systemPrice: 9600,
        principalAmount: 4600,
        riskBand: 'A',
        baseApr: 6.9,
        offers: [],
        fullName: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockQuoteService.createQuote.resolves(mockCreatedQuote);

      // Act
      await quoteController.createQuote(mockRequest, mockResponse);

      // Assert
      expect(mockQuoteService.createQuote.calledOnce).to.be.true;
      const serviceCall = mockQuoteService.createQuote.getCall(0);
      const serviceData = serviceCall.args[0];
      
      expect(serviceData.userId).to.equal('test-user-id');
      expect(serviceData.systemSizeKw).to.equal(8);
      expect(serviceData.monthlyConsumptionKwh).to.equal(650);
      expect(serviceData.downPayment).to.equal(5000);
      expect(serviceData.currency).to.equal('USD');
      
      expect(mockResponse.status).to.have.been.calledWith(201);
      expect(mockResponse.json).to.have.been.calledWith(mockCreatedQuote);
    });

    it('should return 401 when user is not authenticated', async () => {
      // Arrange
      mockRequest.user = undefined;
      mockRequest.body = {
        systemSizeKw: 8,
        monthlyConsumptionKwh: 650
      };

      // Act
      await quoteController.createQuote(mockRequest, mockResponse);

      // Assert
      expect(mockQuoteService.createQuote.called).to.be.false;
      expect(mockResponse.status).to.have.been.calledWith(401);
      expect(mockResponse.json).to.have.been.calledWith({ error: 'User not authenticated' });
    });

    it('should return 400 when systemSizeKw is missing', async () => {
      // Arrange
      mockRequest.body = {
        monthlyConsumptionKwh: 650
      };

      // Act
      await quoteController.createQuote(mockRequest, mockResponse);

      // Assert
      expect(mockQuoteService.createQuote.called).to.be.false;
      expect(mockResponse.status).to.have.been.calledWith(400);
      expect(mockResponse.json).to.have.been.calledWith({ 
        error: 'systemSizeKw and monthlyConsumptionKwh are required' 
      });
    });

    it('should return 400 when monthlyConsumptionKwh is missing', async () => {
      // Arrange
      mockRequest.body = {
        systemSizeKw: 8
      };

      // Act
      await quoteController.createQuote(mockRequest, mockResponse);

      // Assert
      expect(mockQuoteService.createQuote.called).to.be.false;
      expect(mockResponse.status).to.have.been.calledWith(400);
      expect(mockResponse.json).to.have.been.calledWith({ 
        error: 'systemSizeKw and monthlyConsumptionKwh are required' 
      });
    });

    it('should return 400 when systemSizeKw is zero or negative', async () => {
      // Arrange
      mockRequest.body = {
        systemSizeKw: 0,
        monthlyConsumptionKwh: 650
      };

      // Act
      await quoteController.createQuote(mockRequest, mockResponse);

      // Assert
      expect(mockQuoteService.createQuote.called).to.be.false;
      expect(mockResponse.status).to.have.been.calledWith(400);
      expect(mockResponse.json).to.have.been.calledWith({ 
        error: 'systemSizeKw and monthlyConsumptionKwh are required' 
      });
    });

    it('should return 400 when monthlyConsumptionKwh is zero or negative', async () => {
      // Arrange
      mockRequest.body = {
        systemSizeKw: 8,
        monthlyConsumptionKwh: -100
      };

      // Act
      await quoteController.createQuote(mockRequest, mockResponse);

      // Assert
      expect(mockQuoteService.createQuote.called).to.be.false;
      expect(mockResponse.status).to.have.been.calledWith(400);
      expect(mockResponse.json).to.have.been.calledWith({ 
        error: 'systemSizeKw and monthlyConsumptionKwh must be positive' 
      });
    });

    it('should return 400 when downPayment is negative', async () => {
      // Arrange
      mockRequest.body = {
        systemSizeKw: 8,
        monthlyConsumptionKwh: 650,
        downPayment: -1000
      };

      // Act
      await quoteController.createQuote(mockRequest, mockResponse);

      // Assert
      expect(mockQuoteService.createQuote.called).to.be.false;
      expect(mockResponse.status).to.have.been.calledWith(400);
      expect(mockResponse.json).to.have.been.calledWith({ 
        error: 'downPayment must be non-negative' 
      });
    });

    it('should allow downPayment to be zero', async () => {
      // Arrange
      const quoteData: CreateQuoteRequest = {
        systemSizeKw: 8,
        monthlyConsumptionKwh: 650,
        downPayment: 0
      };
      mockRequest.body = quoteData;

      const mockCreatedQuote: QuoteResponse = {
        id: 'new-quote-id',
        userId: 'test-user-id',
        systemSizeKw: 8,
        monthlyConsumptionKwh: 650,
        downPayment: 0,
        currency: 'USD',
        systemPrice: 9600,
        principalAmount: 9600,
        riskBand: 'A',
        baseApr: 6.9,
        offers: [],
        fullName: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockQuoteService.createQuote.resolves(mockCreatedQuote);

      // Act
      await quoteController.createQuote(mockRequest, mockResponse);

      // Assert
      expect(mockQuoteService.createQuote.calledOnce).to.be.true;
      expect(mockResponse.status).to.have.been.calledWith(201);
      expect(mockResponse.json).to.have.been.calledWith(mockCreatedQuote);
    });

    it('should allow downPayment to be undefined (optional field)', async () => {
      // Arrange
      const quoteData: CreateQuoteRequest = {
        systemSizeKw: 8,
        monthlyConsumptionKwh: 650
        // downPayment not provided
      };
      mockRequest.body = quoteData;

      const mockCreatedQuote: QuoteResponse = {
        id: 'new-quote-id',
        userId: 'test-user-id',
        systemSizeKw: 8,
        monthlyConsumptionKwh: 650,
        downPayment: 0, // Should default to 0
        currency: 'USD',
        systemPrice: 9600,
        principalAmount: 9600,
        riskBand: 'A',
        baseApr: 6.9,
        offers: [],
        fullName: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockQuoteService.createQuote.resolves(mockCreatedQuote);

      // Act
      await quoteController.createQuote(mockRequest, mockResponse);

      // Assert
      expect(mockQuoteService.createQuote.calledOnce).to.be.true;
      expect(mockResponse.status).to.have.been.calledWith(201);
      expect(mockResponse.json).to.have.been.calledWith(mockCreatedQuote);
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      const quoteData: CreateQuoteRequest = {
        systemSizeKw: 8,
        monthlyConsumptionKwh: 650,
        downPayment: 5000
      };
      mockRequest.body = quoteData;
      
      const error = new Error('Database connection failed');
      mockQuoteService.createQuote.rejects(error);

      // Act
      await quoteController.createQuote(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).to.have.been.calledWith(500);
      expect(mockResponse.json).to.have.been.calledWith({ error: 'Failed to create quote' });
    });
  });
});
