import dotenv from 'dotenv';

dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: 'development' | 'test' | 'production';
}

export function loadConfig(): AppConfig {
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  const nodeEnv = (process.env.NODE_ENV as AppConfig['nodeEnv']) || 'development';
  return { port, nodeEnv };
}
