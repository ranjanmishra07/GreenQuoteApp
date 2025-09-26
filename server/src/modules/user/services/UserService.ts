import { UserRepository } from '../repository/UserRepository';
import { 
  CreateUserRequest, 
  LoginRequest, 
  AuthResponse, 
  UserResponse,
  JwtPayload 
} from '../dto/api/user.dto';
import { generateToken } from '../middleware/jwt';
import { logger } from '../../../logger';

export class UserService {
  constructor(private userRepository: UserRepository) {}

  async register(data: CreateUserRequest): Promise<UserResponse> {
    try {
      const user = await this.userRepository.create(data);
      
      // Return user without sensitive data
      return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        address: user.address,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    } catch (error) {
      logger.error('User registration failed', { error, email: data.email });
      throw error;
    }
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const user = await this.userRepository.findByEmail(data.email);
      
      if (!user) {
        throw new Error('Invalid email or password');
      }

      const isValidPassword = await this.userRepository.verifyPassword(
        data.password, 
        user.passwordHash
      );

      if (!isValidPassword) {
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

      // Return user without sensitive data
      const userResponse: UserResponse = {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        address: user.address,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      return {
        user: userResponse,
        token
      };
    } catch (error) {
      logger.error('User login failed', { error, email: data.email });
      throw error;
    }
  }

  async getUserById(id: string): Promise<UserResponse | null> {
    try {
      const user = await this.userRepository.findById(id);
      
      if (!user) {
        return null;
      }

      return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        address: user.address,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    } catch (error) {
      logger.error('Get user by ID failed', { error, userId: id });
      throw error;
    }
  }

}
