import { Sequelize } from 'sequelize';
import { loadDatabaseConfig } from './config';
import { logger, logError, logDatabaseOperation, LogContext } from '../logger';

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private sequelize: Sequelize | null = null;
  private config: ReturnType<typeof loadDatabaseConfig>;

  private constructor() {
    this.config = loadDatabaseConfig();
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<void> {
    const logContext: LogContext = {
      service: 'DatabaseConnection',
      method: 'connect',
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
    };

    try {
      logger.info('Starting database connection', logContext);

      this.sequelize = new Sequelize({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        username: this.config.username,
        password: this.config.password,
        dialect: 'postgres',
        logging: false,
        pool: {
          max: this.config.max,
          min: 0,
          acquire: this.config.connectionTimeoutMillis,
          idle: this.config.idleTimeoutMillis,
        },
        define: {
          timestamps: true,
          underscored: true,
          createdAt: 'created_at',
          updatedAt: 'updated_at',
        },
      });

      // Test connection
      logDatabaseOperation('CONNECT', 'database', logContext);
      await this.sequelize.authenticate();

      logger.info('Database connected successfully', {
        ...logContext,
        poolMax: this.config.max,
        connectionTimeout: this.config.connectionTimeoutMillis,
      });
    } catch (error) {
      logError(error as Error, {
        ...logContext,
        operation: 'database_connection',
      });
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.sequelize) {
      logger.info('Disconnecting from database');
      await this.sequelize.close();
      this.sequelize = null;
      logger.info('Database disconnected successfully');
    }
  }

  // Test-only: allow injecting a Sequelize instance (e.g., in-memory SQLite)
  public setSequelizeForTesting(instance: Sequelize): void {
    this.sequelize = instance;
  }

  public getSequelize(): Sequelize {
    if (!this.sequelize) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.sequelize;
  }

  public async sync(force: boolean = false): Promise<void> {
    if (!this.sequelize) {
      throw new Error('Database not connected. Call connect() first.');
    }

    logger.info('Starting database synchronization', { force });
    logDatabaseOperation('SYNC', 'database', { force });
    await this.sequelize.sync({ force });
    logger.info('Database synchronized successfully', { force });
  }
}

// Factory function
export function createDatabaseConnection(): DatabaseConnection {
  return DatabaseConnection.getInstance();
}

// Export getSequelize function for models
export function getSequelize(): Sequelize {
  const db = DatabaseConnection.getInstance();
  return db.getSequelize();
}

// Test-only helper to inject a Sequelize instance
export function setSequelizeForTesting(instance: Sequelize): void {
  DatabaseConnection.getInstance().setSequelizeForTesting(instance);
}
