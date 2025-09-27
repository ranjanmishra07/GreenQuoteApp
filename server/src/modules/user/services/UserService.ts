import { UserRepository } from '../repository/UserRepository';
import { 
  CreateUserRequest, 
  LoginRequest, 
  AuthResponse, 
  UserResponse,
  JwtPayload 
} from '../dto/api/user.dto';
import { generateToken } from '../middleware/jwt';
import { logger, logError, LogContext } from '../../../logger';

export class UserService {
  constructor(private userRepository: UserRepository) {}

  async register(data: CreateUserRequest): Promise<UserResponse> {
    const logContext: LogContext = { 
      service: 'UserService', 
      method: 'register',
      email: data.email 
    };
    
    try {
      const user = await this.userRepository.create(data);
      
      logger.info('User registered successfully', {
        ...logContext,
        userId: user.id,
        roleName: user.roleName
      });
      
      // Return user without sensitive data
      return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        roleName: user.roleName,
        address: user.address,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    } catch (error) {
      logError(error as Error, {
        ...logContext,
        operation: 'user_registration'
      });
      throw error;
    }
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const logContext: LogContext = { 
      service: 'UserService', 
      method: 'login',
      email: data.email 
    };
    
    try {
      const user = await this.userRepository.findByEmail(data.email);
      
      if (!user) {
        logger.warn('Login failed - user not found', logContext);
        throw new Error('Invalid email or password');
      }

      const isValidPassword = await this.userRepository.verifyPassword(
        data.password, 
        user.passwordHash
      );

      if (!isValidPassword) {
        logger.warn('Login failed - invalid password', {
          ...logContext,
          userId: user.id
        });
        throw new Error('Invalid email or password');
      }

      // Update last login
      await this.userRepository.updateLastLogin(user.id);

      // Generate JWT token
      const tokenPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
        userId: user.id,
        fullName: user.fullName,
        email: user.email,
        address: user.address,
        roleName: user.roleName
      };
      const token = generateToken(tokenPayload);

      logger.info('User login successful', {
        ...logContext,
        userId: user.id,
        roleName: user.roleName
      });

      // Return user without sensitive data
      const userResponse: UserResponse = {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        roleName: user.roleName,
        address: user.address,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      return {
        user: userResponse,
        token
      };
    } catch (error) {
      logError(error as Error, {
        ...logContext,
        operation: 'user_login'
      });
      throw error;
    }
  }

  async getUserById(id: string): Promise<UserResponse | null> {
    const logContext: LogContext = { 
      service: 'UserService', 
      method: 'getUserById',
      userId: id 
    };
    
    try {
      const user = await this.userRepository.findById(id);
      
      if (!user) {
        logger.warn('User not found', logContext);
        return null;
      }

      return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        roleName: user.roleName,
        address: user.address,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    } catch (error) {
      logError(error as Error, {
        ...logContext,
        operation: 'get_user_by_id'
      });
      throw error;
    }
  }

}
