import { isDevelopment } from '@infras/common';
import {
  DEBUG_CONFIG,
  JWT_CONFIG,
  APP_CONFIG,
  REDIS_CONFIG,
  ENCRYPTION_CONFIG,
  ACTIVITY_SERVICE_CONFIG,
} from './configuration.consts';

export default () => ({
  [DEBUG_CONFIG]: {
    enableSwagger: process.env.ENABLE_SWAGGER === '1' ? true : false,
  },
  [JWT_CONFIG]: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessTokenExpirationTime: process.env.ACCESS_TOKEN_EXPIRATION_TIME,
    refreshTokenExpirationTime: process.env.REFRESH_TOKEN_EXPIRATION_TIME,
  },
  [APP_CONFIG]: {
    port: parseInt(process.env.PORT, 10),
    host: process.env.HOST,
    env: process.env.ENV,
    cors: {
      // When credentials: true, browser requires exact origin (not *). Allow both Vite dev servers.
      origin: [
        'http://localhost:5174',
        'http://localhost:5175',
        'http://127.0.0.1:5174',
        'http://127.0.0.1:5175',
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      credentials: true,
    },
  },
  [REDIS_CONFIG]: {
    host: isDevelopment() ? '127.0.0.1' : process.env.REDIS_HOST,
    port: isDevelopment() ? 6379 : process.env.REDIS_PORT,
    username: isDevelopment() ? '' : process.env.REDIS_USERNAME,
    password: isDevelopment() ? '' : process.env.REDIS_PASSWORD,
  },
  [ENCRYPTION_CONFIG]: {
    key: process.env.ENCRYPTION_KEY,
  },
  [ACTIVITY_SERVICE_CONFIG]: {
    baseUrl: process.env.ACTIVITY_SERVICE_URL,
    apiKey: process.env.ACTIVITY_SERVICE_API_KEY,
  },
});
