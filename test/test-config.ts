import {
  JWT_CONFIG,
  APP_CONFIG,
  DEBUG_CONFIG,
} from '../src/infrastructure/configuration/configuration.consts';

/**
 * Configuration loader for test environments.
 *
 * Replaces the production ConfigurationModule loader so tests
 * skip .env.example validation and don't require Redis / Supabase credentials.
 */
export const testConfiguration = () => ({
  [DEBUG_CONFIG]: {
    enableSwagger: false,
  },
  [JWT_CONFIG]: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'test-access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'test-refresh-secret',
    accessTokenExpirationTime: process.env.ACCESS_TOKEN_EXPIRATION_TIME || '1h',
    refreshTokenExpirationTime:
      process.env.REFRESH_TOKEN_EXPIRATION_TIME || '7d',
  },
  [APP_CONFIG]: {
    port: 3001,
    host: 'localhost',
    env: 'test',
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      credentials: true,
    },
  },
});
