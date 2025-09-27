import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { 
  CreateUserRequest, 
  LoginRequest, 
  RegisterResponse, 
  LoginResponse,
  ErrorResponse 
} from '../dto/api/user.dto';
import { logger, logError, logAuthEvent, LogContext } from '../../../logger';

export class UserController {
  constructor(private userService: UserService) {}

  async register(req: Request, res: Response): Promise<void> {
    const requestId = (req as any).requestId;
    const logContext: LogContext = { requestId, method: 'register' };
    
    try {
      const userData: CreateUserRequest = req.body;
      
      
      // Basic validation
      if (!userData.fullName || !userData.email || !userData.password) {
        logger.warn('Registration validation failed - missing required fields', logContext);
        const errorResponse: ErrorResponse = {
          success: false,
          message: 'Full name, email, and password are required'
        };
        res.status(400).json(errorResponse);
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        logger.warn('Registration validation failed - invalid email format', {
          ...logContext,
          email: userData.email
        });
        const errorResponse: ErrorResponse = {
          success: false,
          message: 'Invalid email format'
        };
        res.status(400).json(errorResponse);
        return;
      }

      // Password validation
      if (userData.password.length < 6) {
        logger.warn('Registration validation failed - password too short', logContext);
        const errorResponse: ErrorResponse = {
          success: false,
          message: 'Password must be at least 6 characters long'
        };
        res.status(400).json(errorResponse);
        return;
      }

      const user = await this.userService.register(userData);
      
      logAuthEvent('user_registered', {
        ...logContext,
        userId: user.id,
        email: user.email
      });
      
      const response: RegisterResponse = {
        success: true,
        data: user,
        message: 'User registered successfully'
      };
      
      res.status(201).json(response);
    } catch (error) {
      logError(error as Error, {
        ...logContext,
        email: req.body.email,
        operation: 'user_registration'
      });
      
      const errorResponse: ErrorResponse = {
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed'
      };
      
      res.status(400).json(errorResponse);
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    const requestId = (req as any).requestId;
    const logContext: LogContext = { requestId, method: 'login' };
    
    try {
      const loginData: LoginRequest = req.body;
      
      
      // Basic validation
      if (!loginData.email || !loginData.password) {
        logger.warn('Login validation failed - missing credentials', logContext);
        const errorResponse: ErrorResponse = {
          success: false,
          message: 'Email and password are required'
        };
        res.status(400).json(errorResponse);
        return;
      }

      const authResponse = await this.userService.login(loginData);
      
      logAuthEvent('user_login_success', {
        ...logContext,
        userId: authResponse.user.id,
        email: authResponse.user.email,
        roleName: authResponse.user.roleName
      });
      
      const response: LoginResponse = {
        success: true,
        data: authResponse,
        message: 'Login successful'
      };
      
      res.status(200).json(response);
    } catch (error) {
      logAuthEvent('user_login_failed', {
        ...logContext,
        email: req.body.email,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      
      logError(error as Error, {
        ...logContext,
        email: req.body.email,
        operation: 'user_login'
      });
      
      const errorResponse: ErrorResponse = {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed'
      };
      
      res.status(401).json(errorResponse);
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    const requestId = (req as any).requestId;
    const userId = req.user?.userId;
    const logContext: LogContext = { requestId, method: 'getProfile', userId };
    
    try {
      
      if (!userId) {
        logger.warn('Get profile failed - user not authenticated', logContext);
        const errorResponse: ErrorResponse = {
          success: false,
          message: 'User not authenticated'
        };
        res.status(401).json(errorResponse);
        return;
      }

      const user = await this.userService.getUserById(userId);
      
      if (!user) {
        logger.warn('Get profile failed - user not found', logContext);
        const errorResponse: ErrorResponse = {
          success: false,
          message: 'User not found'
        };
        res.status(404).json(errorResponse);
        return;
      }


      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      logError(error as Error, {
        ...logContext,
        operation: 'get_profile'
      });
      
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'Failed to get user profile'
      };
      
      res.status(500).json(errorResponse);
    }
  }

}
