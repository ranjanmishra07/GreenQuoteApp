import express, { Express } from 'express';
import cors from 'cors';
import { loadConfig } from './config';
import { logger } from './logger';
import { createHealthRouter } from './modules/health/router';
import { createUserRouter } from './modules/user/index';
import { createQuoteRouter } from './modules/quotes/index';
import { createDatabaseConnection } from './database/connection';
import { initModels } from './database/models';

let app: Express | null = null;
let server: import('http').Server | null = null;

export function composeApp(): Express {
  const instance = express();
  instance.use(cors());
  instance.use(express.json());

  instance.use('/api/health', createHealthRouter());
  instance.use('/api/users', createUserRouter());
  instance.use('/api/quotes', createQuoteRouter());

  return instance;
}

export async function start() {
  try {
    const config = loadConfig();
    
    // Initialize database connection
    const db = createDatabaseConnection();    
    await db.connect();
    
    // Initialize models and associations
    await initModels();
    
    // Start Express server
    app = composeApp();
    server = app.listen(config.port, () => {
      logger.info(`Server listening on http://localhost:${config.port}`);
      logger.info('Available endpoints:');
      logger.info('  POST /api/users/register - User registration');
      logger.info('  POST /api/users/login - User login');
      logger.info('  GET  /api/users/profile - Get user profile (protected)');
      logger.info('  GET  /api/users/users - Get all users (protected)');
      logger.info('  GET  /api/quotes - Get all quotes');
      logger.info('  GET  /api/quotes/:id - Get quote by ID');
      logger.info('  POST /api/quotes - Create quote (protected)');
      logger.info('  PUT  /api/quotes/:id - Update quote (protected)');
      logger.info('  DELETE /api/quotes/:id - Delete quote (protected)');
      logger.info('  GET  /api/health - Health check');
    });
  } catch (error) {
    logger.error('Failed to start application', { error });
    process.exit(1);
  }

  const shutdown = (signal: string) => {
    logger.warn(`${signal} received, shutting down...`);
    if (server) {
      server.close(err => {
        if (err) {
          logger.error('Error during server close', { err });
          process.exit(1);
        }
        logger.info('HTTP server closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

if (require.main === module) {
  start();
}
