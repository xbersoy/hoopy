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
      type: 'redis',
      port: `redis://${process.env.REDISCLOUD_URL}`,
      options: {
        username: 'default',
        password: 'REDIS_PASSWORD',
        socket: {
          host: 'redis-16575.c59.eu-west-1-2.ec2.redns.redis-cloud.com',
          port: 16575
        }
      }
    },
    ssl: {
      rejectUnauthorized: false,
      // added for connection error
      // also could be achieved with heroku config:set PGSSLMODE=no-verify
    },
  } as DataSourceOptions,
});
