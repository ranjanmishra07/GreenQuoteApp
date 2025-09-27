// Client Configuration
export const config = {
  // Server configuration
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  
  // Client configuration
  clientPort: parseInt(import.meta.env.VITE_CLIENT_PORT) || 5000,
  
  // App configuration
  appName: 'GreenQuote',
  appVersion: '1.0.0',
} as const;

export default config;
