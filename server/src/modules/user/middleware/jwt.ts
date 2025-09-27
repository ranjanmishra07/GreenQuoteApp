import * as jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from '../dto/api/user.dto';
import { logger, logError, logAuthEvent, LogContext } from '../../../logger';
import { loadConfig } from '../../../config';

const config = loadConfig();

export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
}

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req as any).requestId;
  const logContext: LogContext = { 
    requestId, 
    method: 'authenticateToken',
    url: req.url,
    userAgent: req.get('User-Agent')
  };
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN


  if (!token) {
    logger.warn('JWT authentication failed - no token provided', logContext);
    res.status(401).json({
      success: false,
      message: 'Access token required'
    });
    return;
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // Add user info to request
    
    logAuthEvent('jwt_authentication_success', {
      ...logContext,
      userId: decoded.userId,
      email: decoded.email,
      roleName: decoded.roleName
    });
    
    next();
  } catch (error) {
    logAuthEvent('jwt_authentication_failed', {
      ...logContext,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });
    
    logError(error as Error, {
      ...logContext,
      operation: 'jwt_authentication'
    });
    
    res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
}

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
