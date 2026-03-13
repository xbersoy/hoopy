import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createE2EApp, closeTestApp } from './test.setup';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createE2EApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
