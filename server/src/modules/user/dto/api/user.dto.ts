// API Request/Response interfaces
export interface CreateUserRequest {
  fullName: string;
  email: string;
  address?: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
  address?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// API Response interfaces
export interface UserResponse {
  id: string; // Changed to string for epoch-based ID
  fullName: string;
  email: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}

export interface LoginResponse {
  success: boolean;
  data?: AuthResponse;
  message?: string;
}

export interface RegisterResponse {
  success: boolean;
  data?: UserResponse;
  message?: string;
}

// JWT Payload interface
export interface JwtPayload {
  userId: string; // Changed to string for epoch-based ID
  fullName: string;
  email: string;
  address?: string;
  roleName: string;
  iat?: number;
  exp?: number;
}

// Error response interface
export interface ErrorResponse {
  success: false;
  message: string;
  errors?: string[];
}
