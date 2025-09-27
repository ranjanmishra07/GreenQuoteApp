import { expect } from "chai"
import { setupTestDB, resetTestDB, teardownTestDB } from "../../../db-setup"
import { setSequelizeForTesting } from "../../../../src/database/connection"
import { RolesEnum } from "../../../../src/modules/user/dto/types"
import * as bcrypt from "bcrypt"

describe('QuoteService Integration Tests', () => {
  let quoteService: any
  let testUser: any
  let testQuote: any
  let User: any
  let Quote: any

  before(async () => {
    // Setup test database FIRST
    const testSequelize = await setupTestDB()
    
    // Set the test database for the application models BEFORE importing models
    setSequelizeForTesting(testSequelize)
    
    // Now import the models after database is set up
    const userModel = await import("../../../../src/database/models/user.model")
    const quoteModel = await import("../../../../src/database/models/quote.model")
    const quoteServiceModule = await import("../../../../src/modules/quotes/services/qouteService")
    const modelsModule = await import("../../../../src/database/models")
    
    User = userModel.User
    Quote = quoteModel.Quote
    quoteService = new quoteServiceModule.QuoteService()

    // Initialize models with associations
    await modelsModule.initModels()

    // Reset database to ensure clean state
    await resetTestDB(true)
    
    // Create test user
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash('password123', salt)
    
    testUser = await User.create({
      fullName: 'Test User',
      email: 'test@example.com',
      passwordHash,
      salt,
      roleName: RolesEnum.USER,
      address: '123 Test Street'
    })

    // Create test quote
    testQuote = await Quote.create({
      userId: testUser.id,
      systemSizeKw: 6,
      monthlyConsumptionKwh: 550,
      downPayment: 1200,
      currency: 'USD',
      systemPrice: 7200,
      principalAmount: 6000,
      riskBand: 'A',
      baseApr: 6.9,
      offers: [
        { termYears: 5, apr: 6.9, principalUsed: 6000, monthlyPayment: 118.5 },
        { termYears: 10, apr: 6.9, principalUsed: 6000, monthlyPayment: 69.2 },
        { termYears: 15, apr: 6.9, principalUsed: 6000, monthlyPayment: 53.1 }
      ]
    })

    // Service is already initialized above
  })

  after(async () => {
    await teardownTestDB()
  })

  // Tests for getQuoteById function
  describe('getQuoteById', () => {
    it('should return quote with author details for the owning user', async () => {
      const result = await quoteService.getQuoteById(testQuote.id, testUser.id)
      
      expect(result).to.exist
      expect(result!.id).to.equal(testQuote.id)
      expect(result!.userId).to.equal(testUser.id)
      expect(result!.systemSizeKw).to.equal(6)
      expect(result!.monthlyConsumptionKwh).to.equal(550)
      expect(result!.downPayment).to.equal(1200)
      expect(result!.currency).to.equal('USD')
      expect(result!.systemPrice).to.equal(7200)
      expect(result!.principalAmount).to.equal(6000)
      expect(result!.riskBand).to.equal('A')
      expect(result!.baseApr).to.equal(6.9)
      expect(result!.offers).to.be.an('array')
      expect(result!.offers).to.have.lengthOf(3)
      
      // Check user details from author relationship
      expect(result!.fullName).to.equal('Test User')
      expect(result!.email).to.equal('test@example.com')
      expect(result!.address).to.equal('123 Test Street')
      
      // Check author object
      expect(result!.author).to.exist
      expect(result!.author.id).to.equal(testUser.id)
      expect(result!.author.fullName).to.equal('Test User')
      expect(result!.author.email).to.equal('test@example.com')
      
      // Check timestamps
      expect(result!.createdAt).to.exist
      expect(result!.updatedAt).to.exist
    })

    it('should return null for non-existent quote', async () => {
      const result = await quoteService.getQuoteById('non-existent-id', testUser.id)
      expect(result).to.be.null
    })

    it('should return null for quote owned by different user', async () => {
      // Create another user
      const salt = await bcrypt.genSalt(10)
      const passwordHash = await bcrypt.hash('password123', salt)
      
      const anotherUser = await User.create({
        fullName: 'Another User',
        email: 'another@example.com',
        passwordHash,
        salt,
        roleName: RolesEnum.USER,
        address: '456 Another Street'
      })

      const result = await quoteService.getQuoteById(testQuote.id, anotherUser.id)
      expect(result).to.be.null
    })

    it('should return null for invalid user ID', async () => {
      const result = await quoteService.getQuoteById(testQuote.id, 'invalid-user-id')
      expect(result).to.be.null
    })
  })

  // Tests for getAllQuotes function
  describe('getAllQuotes', () => {
    it('should return quotes for regular user (filtered by userId)', async () => {
      const result = await quoteService.getAllQuotes(testUser.id, 1, 10)
      
      expect(result).to.exist
      expect(result.quotes).to.be.an('array')
      expect(result.quotes).to.have.lengthOf(1)
      expect(result.totalCount).to.equal(1)
      expect(result.totalPages).to.equal(1)
      expect(result.currentPage).to.equal(1)
      
      const quote = result.quotes[0]
      expect(quote.id).to.equal(testQuote.id)
      expect(quote.userId).to.equal(testUser.id)
      expect(quote.fullName).to.equal('Test User')
      expect(quote.email).to.equal('test@example.com')
    })

    it('should return empty array for user with no quotes', async () => {
      // Create another user with no quotes
      const salt = await bcrypt.genSalt(10)
      const passwordHash = await bcrypt.hash('password123', salt)
      
      const anotherUser = await User.create({
        fullName: 'Another User',
        email: 'another2@example.com',
        passwordHash,
        salt,
        roleName: RolesEnum.USER,
        address: '456 Another Street'
      })

      const result = await quoteService.getAllQuotes(anotherUser.id, 1, 10)
      
      expect(result).to.exist
      expect(result.quotes).to.be.an('array')
      expect(result.quotes).to.have.lengthOf(0)
      expect(result.totalCount).to.equal(0)
      expect(result.totalPages).to.equal(0)
      expect(result.currentPage).to.equal(1)
    })

    it('should return all quotes for ADMIN user', async () => {
      // Create admin user
      const salt = await bcrypt.genSalt(10)
      const passwordHash = await bcrypt.hash('password123', salt)
      
      const adminUser = await User.create({
        fullName: 'Admin User',
        email: 'admin2@example.com',
        passwordHash,
        salt,
        roleName: RolesEnum.ADMIN,
        address: '789 Admin Street'
      })

      const result = await quoteService.getAllQuotes(adminUser.id, 1, 10, RolesEnum.ADMIN)
      
      expect(result).to.exist
      expect(result.quotes).to.be.an('array')
      expect(result.quotes).to.have.lengthOf(1) // Should see the test quote
      expect(result.totalCount).to.equal(1)
      expect(result.totalPages).to.equal(1)
      expect(result.currentPage).to.equal(1)
    })

    it('should handle pagination correctly', async () => {
      // Create additional quotes for pagination test
      await Quote.create({
        userId: testUser.id,
        systemSizeKw: 8,
        monthlyConsumptionKwh: 600,
        downPayment: 1500,
        currency: 'USD',
        systemPrice: 9600,
        principalAmount: 8100,
        riskBand: 'A',
        baseApr: 6.9,
        offers: [
          { termYears: 5, apr: 6.9, principalUsed: 8100, monthlyPayment: 160.2 }
        ]
      })

      const result = await quoteService.getAllQuotes(testUser.id, 1, 1)
      
      expect(result).to.exist
      expect(result.quotes).to.be.an('array')
      expect(result.quotes).to.have.lengthOf(1)
      expect(result.totalCount).to.equal(2)
      expect(result.totalPages).to.equal(2)
      expect(result.currentPage).to.equal(1)
    })
  })

  // Tests for createQuote function
  describe('createQuote', () => {
    it('should create a new quote successfully', async () => {
      const quoteData = {
        systemSizeKw: 10,
        monthlyConsumptionKwh: 800,
        downPayment: 2000,
        currency: 'USD',
        userId: testUser.id
      }

      const result = await quoteService.createQuote(quoteData)
      
      expect(result).to.exist
      expect(result.id).to.exist
      expect(result.userId).to.equal(testUser.id)
      expect(result.systemSizeKw).to.equal(10)
      expect(result.monthlyConsumptionKwh).to.equal(800)
      expect(result.downPayment).to.equal(2000)
      expect(result.currency).to.equal('USD')
      expect(result.systemPrice).to.equal(12000) // 10 * 1200
      expect(result.principalAmount).to.equal(10000) // 12000 - 2000
      expect(result.riskBand).to.exist
      expect(result.baseApr).to.exist
      expect(result.offers).to.be.an('array')
      expect(result.fullName).to.equal('Test User')
      expect(result.email).to.equal('test@example.com')
      expect(result.address).to.equal('123 Test Street')
      expect(result.createdAt).to.exist
      expect(result.updatedAt).to.exist
    })

    it('should throw error for non-existent user', async () => {
      const quoteData = {
        systemSizeKw: 5,
        monthlyConsumptionKwh: 400,
        downPayment: 1000,
        currency: 'USD',
        userId: 'non-existent-user-id'
      }

      try {
        await quoteService.createQuote(quoteData)
        expect.fail('Should have thrown an error')
      } catch (error) {
        // The error could be either "User not found" or a foreign key constraint error
        expect(error.message).to.satisfy((msg: string) => 
          msg === 'User not found' || msg.includes('FOREIGN KEY constraint')
        )
      }
    })

    it('should use default currency when not provided', async () => {
      const quoteData = {
        systemSizeKw: 6,
        monthlyConsumptionKwh: 500,
        downPayment: 1200,
        userId: testUser.id
        // currency not provided
      }

      const result = await quoteService.createQuote(quoteData)
      
      expect(result).to.exist
      expect(result.currency).to.equal('USD') // Should default to USD
      expect(result.systemSizeKw).to.equal(6)
      expect(result.monthlyConsumptionKwh).to.equal(500)
      expect(result.downPayment).to.equal(1200)
    })
  })
})
