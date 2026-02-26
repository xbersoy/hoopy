import { DataSource } from 'typeorm';
import { join } from 'path';
import * as dotenv from 'dotenv';

// .env dosyasını yükle
dotenv.config();

const isDevelopment = process.env.NODE_ENV !== 'production';

// Migration için DataSource örneği
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [join(__dirname, '../../../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '../../../migrations/*{.ts,.js}')],
  logging: isDevelopment,
  synchronize: false,
  ssl: !isDevelopment ? {
    rejectUnauthorized: false
  } : undefined
}); 