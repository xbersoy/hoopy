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
        username: 'default',
        password: process.env.REDIS_PASSWORD,
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
      }
    },
    // ssl: {
    //   rejectUnauthorized: false,
    //   // added for connection error
    //   // also could be achieved with heroku config:set PGSSLMODE=no-verify
    // },
  } as DataSourceOptions,
});
