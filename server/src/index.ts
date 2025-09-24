import express, { Express } from 'express';
import cors from 'cors';
import { loadConfig } from './config.js';
import { logger } from './logger.js';
import { createHealthRouter } from './modules/health/router.js';

let app: Express | null = null;
let server: import('http').Server | null = null;

export function composeApp(): Express {
  const instance = express();
  instance.use(cors());
  instance.use(express.json());

  instance.use('/api/health', createHealthRouter());

  return instance;
}

export async function start() {
  const config = loadConfig();
  app = composeApp();
  server = app.listen(config.port, () => {
    logger.info(`Server listening on http://localhost:${config.port}`);
  });

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

if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}
