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
    timezone: 'Z',
    cache: {
    	type: 'ioredis',
    	port: `redis://${process.env.REDISCLOUD_URL}`,
    },
    ssl: {
      rejectUnauthorized: false,
    },
  } as DataSourceOptions,
});
