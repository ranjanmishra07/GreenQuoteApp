import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import { Request, Response } from 'express';

const isProduction = process.env.NODE_ENV === 'production';

// Enhanced console format with structured logging
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const rest = Object.keys(meta).length ? ` ${JSON.stringify(meta, null, 2)}` : '';
    return `${timestamp} [${level}]: ${message}${rest}`;
  })
);

// File format for production
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || 'info',
    format: consoleFormat
  })
];

if (isProduction) {
  transports.push(
    new DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: process.env.LOG_LEVEL || 'info',
      format: fileFormat
    }),
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',
      format: fileFormat
    })
  );
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports,
  defaultMeta: {
    service: 'greenquote-server',
    version: process.env.npm_package_version || '1.0.0'
  }
});

// Structured logging utilities
export interface LogContext {
  userId?: string;
  requestId?: string;
  method?: string;
  url?: string;
  userAgent?: string;
  ip?: string;
  duration?: string | number;
  statusCode?: number;
  error?: Error;
  [key: string]: any;
}

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: any) => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Add request ID to request object
  (req as any).requestId = requestId;
  
  // Log incoming request
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId: (req as any).user?.userId,
    body: req.method !== 'GET' ? req.body : undefined
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any, cb?: any) {
    const duration = Date.now() - startTime;
    
    logger.info('Request completed', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: (req as any).user?.userId,
      responseSize: chunk ? chunk.length : 0
    });

    return originalEnd.call(this, chunk, encoding, cb);
  };

  next();
};

// Error logging utility
export const logError = (error: Error, context: LogContext = {}) => {
  logger.error('Application error', {
    ...context,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    }
  });
};

// Service method logging decorator
export const logServiceMethod = (serviceName: string, methodName: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      const startTime = Date.now();
      const requestId = `svc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      logger.debug('Service method started', {
        requestId,
        service: serviceName,
        method: methodName,
        args: args.length > 0 ? args : undefined
      });

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;
        
        logger.debug('Service method completed', {
          requestId,
          service: serviceName,
          method: methodName,
          duration: `${duration}ms`,
          success: true
        });

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        logError(error as Error, {
          requestId,
          service: serviceName,
          method: methodName,
          duration: `${duration}ms`,
          args: args.length > 0 ? args : undefined
        });

        throw error;
      }
    };

    return descriptor;
  };
};

// Database operation logging
export const logDatabaseOperation = (operation: string, table: string, context: LogContext = {}) => {
  logger.debug('Database operation', {
    operation,
    table,
    ...context
  });
};

// Authentication logging
export const logAuthEvent = (event: string, context: LogContext = {}) => {
  logger.info('Authentication event', {
    event,
    ...context
  });
};

// Business logic logging
export const logBusinessEvent = (event: string, context: LogContext = {}) => {
  logger.info('Business event', {
    event,
    ...context
  });
};
