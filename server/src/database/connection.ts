import { Sequelize } from 'sequelize';
import { loadDatabaseConfig } from './config';
import { logger } from '../logger';

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
    try {
      this.sequelize = new Sequelize({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        username: this.config.username,
        password: this.config.password,
        dialect: 'postgres',
        logging: (msg) => logger.debug(msg),
        pool: {
          max: this.config.max,
          min: 0,
          acquire: this.config.connectionTimeoutMillis,
          idle: this.config.idleTimeoutMillis
        },
        define: {
          timestamps: true,
          underscored: true,
          createdAt: 'created_at',
          updatedAt: 'updated_at'
        }
      });

      // Test connection
      await this.sequelize.authenticate();

      logger.info('Database connected successfully', {
        host: this.config.host,
        port: this.config.port,
        database: this.config.database
      });
    } catch (error) {
      logger.error('Database connection failed', { error });
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.sequelize) {
      await this.sequelize.close();
      this.sequelize = null;
      logger.info('Database disconnected');
    }
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
    await this.sequelize.sync({ force });
    logger.info('Database synchronized');
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
