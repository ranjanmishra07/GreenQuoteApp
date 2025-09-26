import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { 
  CreateUserRequest, 
  LoginRequest, 
  RegisterResponse, 
  LoginResponse,
  ErrorResponse 
} from '../dto/api/user.dto';
import { logger } from '../../../logger';

export class UserController {
  constructor(private userService: UserService) {}

  async register(req: Request, res: Response): Promise<void> {
    try {
      const userData: CreateUserRequest = req.body;
      
      // Basic validation
      if (!userData.fullName || !userData.email || !userData.password) {
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
        const errorResponse: ErrorResponse = {
          success: false,
          message: 'Invalid email format'
        };
        res.status(400).json(errorResponse);
        return;
      }

      // Password validation
      if (userData.password.length < 6) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: 'Password must be at least 6 characters long'
        };
        res.status(400).json(errorResponse);
        return;
      }

      const user = await this.userService.register(userData);
      
      const response: RegisterResponse = {
        success: true,
        data: user,
        message: 'User registered successfully'
      };
      
      res.status(201).json(response);
    } catch (error) {
      logger.error('User registration failed in controller', { error, body: req.body });
      
      const errorResponse: ErrorResponse = {
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed'
      };
      
      res.status(400).json(errorResponse);
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const loginData: LoginRequest = req.body;
      
      // Basic validation
      if (!loginData.email || !loginData.password) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: 'Email and password are required'
        };
        res.status(400).json(errorResponse);
        return;
      }

      const authResponse = await this.userService.login(loginData);
      
      const response: LoginResponse = {
        success: true,
        data: authResponse,
        message: 'Login successful'
      };
      
      res.status(200).json(response);
    } catch (error) {
      logger.error('User login failed in controller', { error, email: req.body.email });
      
      const errorResponse: ErrorResponse = {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed'
      };
      
      res.status(401).json(errorResponse);
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: 'User not authenticated'
        };
        res.status(401).json(errorResponse);
        return;
      }

      const user = await this.userService.getUserById(userId);
      
      if (!user) {
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
      logger.error('Get profile failed in controller', { error, userId: req.user?.userId });
      
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'Failed to get user profile'
      };
      
      res.status(500).json(errorResponse);
    }
  }

}
