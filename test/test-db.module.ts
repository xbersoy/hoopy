import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

/**
 * Test-specific database module.
 *
 * - `synchronize: true`  → creates schema from entity metadata (no migrations needed)
 * - `dropSchema: true`   → drops all tables on connection so every test suite starts clean
 *
 * Requires TEST_DATABASE_URL or DATABASE_URL in the environment (loaded from .env.test).
 *
 * ⚠️  NEVER point this at a production database — dropSchema will destroy all data.
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url:
        process.env.TEST_DATABASE_URL ||
        process.env.DATABASE_URL ||
        'postgresql://postgres:postgres@localhost:5432/hoopy_test',
      autoLoadEntities: true,
      synchronize: true,
      dropSchema: true,
      logging: false,
    }),
  ],
})
export class TestDatabaseModule {}
