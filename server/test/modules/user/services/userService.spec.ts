import { expect } from 'chai';
import { UserService } from '../../../../src/modules/user/services/UserService';
import { UserRepository } from '../../../../src/modules/user/repository/UserRepository';
import { LoginRequest, UserResponse } from '../../../../src/modules/user/dto/api/user.dto';
import * as sinon from 'sinon';
import * as bcrypt from 'bcrypt';

describe('UserService Unit Tests', () => {
  let userService: UserService;
  let mockUserRepository: sinon.SinonStubbedInstance<UserRepository>;

  beforeEach(() => {
    // Create a stubbed UserRepository
    mockUserRepository = sinon.createStubInstance(UserRepository);
    
    // Create UserService with mocked repository
    userService = new UserService(mockUserRepository as any);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      // Arrange
      const loginData: LoginRequest = {
        email: 'test@example.com',
        password: 'password123'
      };

      // Generate real password hash
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('password123', salt);

      const mockUser = {
        id: 'user-123',
        fullName: 'Test User',
        email: 'test@example.com',
        passwordHash: passwordHash,
        salt: salt,
        roleName: 'USER',
        address: '123 Test Street',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      } as any;

      const expectedUserResponse: UserResponse = {
        id: 'user-123',
        fullName: 'Test User',
        email: 'test@example.com',
        roleName: 'USER',
        address: '123 Test Street',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      };

      // Mock repository methods
      mockUserRepository.findByEmail.resolves(mockUser);
      mockUserRepository.verifyPassword.callsFake(async (password, hash) => {
        return await bcrypt.compare(password, hash);
      });
      mockUserRepository.updateLastLogin.resolves();

      // Act
      const result = await userService.login(loginData);

      // Assert
      expect(result).to.exist;
      expect(result.user).to.deep.equal(expectedUserResponse);
      expect(result.token).to.be.a('string');
      expect(result.token).to.not.be.empty;

      // Verify repository calls
      expect(mockUserRepository.findByEmail.calledOnce).to.be.true;
      expect(mockUserRepository.findByEmail.calledWith('test@example.com')).to.be.true;
      
      expect(mockUserRepository.verifyPassword.calledOnce).to.be.true;
      expect(mockUserRepository.verifyPassword.calledWith('password123', passwordHash)).to.be.true;
      
      expect(mockUserRepository.updateLastLogin.calledOnce).to.be.true;
      expect(mockUserRepository.updateLastLogin.calledWith('user-123')).to.be.true;

      // Verify JWT token is valid (can be decoded)
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(result.token, process.env.JWT_SECRET || 'test-secret');
      expect(decoded.userId).to.equal('user-123');
      expect(decoded.fullName).to.equal('Test User');
      expect(decoded.email).to.equal('test@example.com');
      expect(decoded.roleName).to.equal('USER');
      expect(decoded.address).to.equal('123 Test Street');
    });

    it('should throw error when user is not found', async () => {
      // Arrange
      const loginData: LoginRequest = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      // Mock repository to return null (user not found)
      mockUserRepository.findByEmail.resolves(null);

      // Act & Assert
      try {
        await userService.login(loginData);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Invalid email or password');
      }

      // Verify repository calls
      expect(mockUserRepository.findByEmail.calledOnce).to.be.true;
      expect(mockUserRepository.findByEmail.calledWith('nonexistent@example.com')).to.be.true;
      expect(mockUserRepository.verifyPassword.called).to.be.false;
      expect(mockUserRepository.updateLastLogin.called).to.be.false;
    });

    it('should throw error when password is invalid', async () => {
      // Arrange
      const loginData: LoginRequest = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      // Generate real password hash for correct password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('correctpassword', salt);

      const mockUser = {
        id: 'user-123',
        fullName: 'Test User',
        email: 'test@example.com',
        passwordHash: passwordHash,
        salt: salt,
        roleName: 'USER',
        address: '123 Test Street',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      } as any;

      // Mock repository methods
      mockUserRepository.findByEmail.resolves(mockUser);
      mockUserRepository.verifyPassword.callsFake(async (password, hash) => {
        return await bcrypt.compare(password, hash);
      });

      // Act & Assert
      try {
        await userService.login(loginData);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Invalid email or password');
      }

      // Verify repository calls
      expect(mockUserRepository.findByEmail.calledOnce).to.be.true;
      expect(mockUserRepository.findByEmail.calledWith('test@example.com')).to.be.true;
      
      expect(mockUserRepository.verifyPassword.calledOnce).to.be.true;
      expect(mockUserRepository.verifyPassword.calledWith('wrongpassword', passwordHash)).to.be.true;
      
      expect(mockUserRepository.updateLastLogin.called).to.be.false;
    });

    it('should login successfully for admin user', async () => {
      // Arrange
      const loginData: LoginRequest = {
        email: 'admin@example.com',
        password: 'adminpassword'
      };

      // Generate real password hash
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('adminpassword', salt);

      const mockAdminUser = {
        id: 'admin-123',
        fullName: 'Admin User',
        email: 'admin@example.com',
        passwordHash: passwordHash,
        salt: salt,
        roleName: 'ADMIN',
        address: '456 Admin Street',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      } as any;

      const expectedUserResponse: UserResponse = {
        id: 'admin-123',
        fullName: 'Admin User',
        email: 'admin@example.com',
        roleName: 'ADMIN',
        address: '456 Admin Street',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      };

      // Mock repository methods
      mockUserRepository.findByEmail.resolves(mockAdminUser);
      mockUserRepository.verifyPassword.callsFake(async (password, hash) => {
        return await bcrypt.compare(password, hash);
      });
      mockUserRepository.updateLastLogin.resolves();

      // Act
      const result = await userService.login(loginData);

      // Assert
      expect(result).to.exist;
      expect(result.user).to.deep.equal(expectedUserResponse);
      expect(result.token).to.be.a('string');
      expect(result.token).to.not.be.empty;

      // Verify JWT token payload includes admin role
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(result.token, process.env.JWT_SECRET || 'test-secret');
      expect(decoded.roleName).to.equal('ADMIN');
      expect(decoded.userId).to.equal('admin-123');
      expect(decoded.fullName).to.equal('Admin User');
      expect(decoded.email).to.equal('admin@example.com');
    });

    it('should propagate repository errors', async () => {
      // Arrange
      const loginData: LoginRequest = {
        email: 'test@example.com',
        password: 'password123'
      };

      const repositoryError = new Error('Database connection failed');
      mockUserRepository.findByEmail.rejects(repositoryError);

      // Act & Assert
      try {
        await userService.login(loginData);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.equal(repositoryError);
      }

      // Verify repository was called
      expect(mockUserRepository.findByEmail.calledOnce).to.be.true;
    });
  });
});
