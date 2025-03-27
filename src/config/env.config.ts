import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
}));

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT, 10) || 8080,
})); 