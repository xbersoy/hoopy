import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { TestDatabaseModule } from './test-db.module';
import { testConfiguration } from './test-config';
import { UserModule } from '../src/user/user.module';
import { AuthModule } from '../src/auth/auth.module';
import { CompanyModule } from '../src/company/company.module';
import { AccountModule } from '../src/account/account.module';
import { ContactModule } from '../src/contact/contact.module';
import { EmployeeModule } from '../src/employee/employee.module';
import { OrgStructureModule } from '../src/org-structure/org-structure.module';
import { AttachmentsModule } from '../src/attachments/attachments.module';
import { AppController } from '../src/app.controller';

/**
 * Creates a fully wired NestJS application for E2E / integration tests.
 *
 * Key differences from the production AppModule:
 * - Uses TestDatabaseModule  → Postgres with synchronize + dropSchema (schema from entities, no migrations)
 * - Uses plain ConfigModule   → test-friendly defaults, no .env.example validation
 * - Mocks StorageService      → avoids Supabase dependency
 * - Does NOT initialise Supabase
 *
 * Requires a running Postgres instance with the test database.
 * See .env.test.example for required environment variables.
 */
export async function createE2EApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [testConfiguration],
      }),
      TestDatabaseModule,
      UserModule,
      AuthModule,
      CompanyModule,
      AccountModule,
      ContactModule,
      EmployeeModule,
      OrgStructureModule,
      AttachmentsModule,
    ],
    controllers: [AppController],
  })
    .overrideProvider('StorageService')
    .useValue({
      upload: jest.fn().mockResolvedValue({
        url: 'https://test-storage.example.com/uploads/test-file.pdf',
      }),
      delete: jest.fn().mockResolvedValue(undefined),
      getPublicUrl: jest
        .fn()
        .mockResolvedValue(
          'https://test-storage.example.com/uploads/test-file.pdf',
        ),
    })
    .compile();

  const app = moduleFixture.createNestApplication();
  // Mirror production bootstrap pipe settings
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.init();
  return app;
}

/**
 * Truncates every table in the test database while preserving schema.
 * Use in `beforeEach` for isolation between individual test cases.
 */
export async function cleanDatabase(app: INestApplication): Promise<void> {
  const dataSource = app.get(DataSource);
  const entities = dataSource.entityMetadatas;

  for (const entity of entities) {
    const repo = dataSource.getRepository(entity.name);
    await repo.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE`);
  }
}

/**
 * Gracefully shuts down the application and its DB connection.
 * Use in `afterAll`.
 */
export async function closeTestApp(app: INestApplication): Promise<void> {
  await app.close();
}
