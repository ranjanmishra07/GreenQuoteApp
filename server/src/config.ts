import * as dotenv from 'dotenv';

dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: 'development' | 'test' | 'production';
  jwtSecret: string;
  jwtExpiresIn: number;
}

export function loadConfig(): AppConfig {
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  const nodeEnv = (process.env.NODE_ENV as AppConfig['nodeEnv']) || 'development';
  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN ? Number(process.env.JWT_EXPIRES_IN) : 300;
  
  return { 
    port, 
    nodeEnv, 
    jwtSecret, 
    jwtExpiresIn 
  };
}
