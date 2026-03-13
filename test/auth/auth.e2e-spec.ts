import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createE2EApp, closeTestApp, cleanDatabase } from '../test.setup';

/**
 * Auth end-to-end tests.
 *
 * These hit a REAL Postgres test database and exercise the full
 * request → guard → controller → service → repository → DB stack.
 *
 * Requires: a running Postgres instance with the test database.
 * See test/.env.test.example for configuration.
 */
describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createE2EApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  beforeEach(async () => {
    await cleanDatabase(app);
  });

  const validRegisterDto = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'password123',
    account: {
      name: 'Test Account',
      type: 'Personal',
    },
  };

  // ── Registration ──────────────────────────────────────────

  describe('POST /auth/register', () => {
    it('should register a new user and return tokens', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterDto)
        .expect(201);

      expect(body).toHaveProperty('accessToken');
      expect(body).toHaveProperty('refreshToken');
      expect(typeof body.accessToken).toBe('string');
      expect(typeof body.refreshToken).toBe('string');
    });

    it('should reject duplicate email registration', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterDto)
        .expect(201);

      const { body } = await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterDto)
        .expect(400);

      expect(body.message).toContain('already exists');
    });

    it('should reject missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'test@example.com' })
        .expect(400);
    });

    it('should reject password shorter than 8 characters', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...validRegisterDto, password: 'short' })
        .expect(400);
    });

    it('should reject invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...validRegisterDto, email: 'not-an-email' })
        .expect(400);
    });

    it('should register with optional phoneNumber', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...validRegisterDto, phoneNumber: '+905551234567' })
        .expect(201);

      expect(body.accessToken).toBeDefined();
    });
  });

  // ── Login ─────────────────────────────────────────────────

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterDto);
    });

    it('should login with valid credentials and return tokens', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: validRegisterDto.email,
          password: validRegisterDto.password,
        })
        .expect(201);

      expect(body).toHaveProperty('accessToken');
      expect(body).toHaveProperty('refreshToken');
    });

    it('should reject invalid password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: validRegisterDto.email, password: 'wrongpassword' })
        .expect(401);
    });

    it('should reject non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nobody@example.com', password: 'password123' })
        .expect(401);
    });
  });

  // ── Token refresh ─────────────────────────────────────────

  describe('POST /auth/refresh', () => {
    it('should issue new token pair with a valid refresh token', async () => {
      const { body: registerRes } = await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterDto);

      const { body: refreshed } = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: registerRes.refreshToken })
        .expect(201);

      expect(refreshed).toHaveProperty('accessToken');
      expect(refreshed).toHaveProperty('refreshToken');
      // Tokens should be different from original
      expect(refreshed.accessToken).not.toBe(registerRes.accessToken);
    });

    it('should reject an invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'totally.invalid.token' })
        .expect(401);
    });

    it('should reject a refresh token after it has been rotated', async () => {
      const { body: registerRes } = await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterDto);

      // Rotate the token
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: registerRes.refreshToken })
        .expect(201);

      // Old token should no longer work
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: registerRes.refreshToken })
        .expect(401);
    });
  });

  // ── Guard enforcement ─────────────────────────────────────

  describe('Guard enforcement', () => {
    it('should reject unauthenticated request to a protected endpoint', async () => {
      await request(app.getHttpServer()).get('/employees').expect(401);
    });

    it('should reject request with an invalid Bearer token', async () => {
      await request(app.getHttpServer())
        .get('/employees')
        .set('Authorization', 'Bearer invalid.jwt.token')
        .expect(401);
    });

    it('should allow authenticated request to a protected endpoint', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterDto);

      const { body: employees } = await request(app.getHttpServer())
        .get('/employees')
        .set('Authorization', `Bearer ${body.accessToken}`)
        .expect(200);

      expect(Array.isArray(employees)).toBe(true);
    });
  });

  // ── Full lifecycle ────────────────────────────────────────

  describe('Full Auth Lifecycle', () => {
    it('register → login → refresh → logout → refresh rejected', async () => {
      // 1. Register
      const { body: registerRes } = await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterDto)
        .expect(201);

      expect(registerRes.accessToken).toBeDefined();

      // 2. Login
      const { body: loginRes } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: validRegisterDto.email,
          password: validRegisterDto.password,
        })
        .expect(201);

      expect(loginRes.accessToken).toBeDefined();

      // 3. Refresh
      const { body: refreshRes } = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: loginRes.refreshToken })
        .expect(201);

      expect(refreshRes.accessToken).toBeDefined();

      // 4. Decode JWT to extract userId
      const payload = JSON.parse(
        Buffer.from(refreshRes.accessToken.split('.')[1], 'base64').toString(),
      );

      // 5. Logout
      await request(app.getHttpServer())
        .post(`/auth/logout/${payload.sub}`)
        .expect(201);

      // 6. Previous refresh token should now be rejected
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: refreshRes.refreshToken })
        .expect(401);
    });
  });
});
