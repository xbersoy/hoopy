import { DataSourceOptions } from 'typeorm';
import { isDevelopment } from '@infras/common';
import { TYPEORM_CONFIG_PROVIDER } from './typeorm.constants';

export default () => ({
  [TYPEORM_CONFIG_PROVIDER]: {
    type: 'postgres',
    url: process.env.DATABASE_URL,
    autoLoadEntities: true,
    logging: isDevelopment(),
    synchronize: true,
    dropSchema: isDevelopment(),
    timezone: 'Z',
    cache: {
      type: 'ioredis',
      options: {
        host: isDevelopment() ? '127.0.0.1' : process.env.REDIS_HOST,
        port: isDevelopment() ? 6379 : process.env.REDIS_PORT,
        username: isDevelopment() ? '' : process.env.REDIS_USERNAME,
        password: isDevelopment() ? '' : process.env.REDIS_PASSWORD,
      }
    },
    ...(!isDevelopment() && { ssl: {
      rejectUnauthorized: isDevelopment(),
      // added for connection error
      // also could be achieved with heroku config:set PGSSLMODE=no-verify
    }}),
  } as unknown as DataSourceOptions,
});
