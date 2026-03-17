import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { ActivityClientService } from '../../src/activity-client/services/activity-client.service';
import {
  ActivityCategory,
  ActorType,
} from '../../src/activity-client/constants';

describe('ActivityClientService', () => {
  let service: ActivityClientService;
  let httpService: any;
  let loggerErrorSpy: jest.SpyInstance;

  const mockConfig = {
    baseUrl: 'http://localhost:4000',
    apiKey: 'test-api-key',
  };

  beforeEach(async () => {
    const mockHttpService = {
      post: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityClientService,
        { provide: HttpService, useValue: mockHttpService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(mockConfig),
          },
        },
      ],
    }).compile();

    service = module.get<ActivityClientService>(ActivityClientService);
    httpService = module.get(HttpService);

    // Spy on logger to verify error handling
    loggerErrorSpy = jest
      .spyOn((service as any).logger, 'error')
      .mockImplementation();
    loggerWarnSpy = jest
      .spyOn((service as any).logger, 'warn')
      .mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const basePayload = {
    accountId: 'aaaa-aaaa',
    companyId: 'cccc-cccc',
    actorUserId: 'uuuu-uuuu',
    actorType: ActorType.USER,
    actorLabel: 'John Doe',
    action: 'employee.created',
    category: ActivityCategory.EMPLOYEE,
    targetEntityType: 'employee',
    targetEntityId: 'eeee-eeee',
    targetEntityLabel: 'Jane Smith',
    description: 'Created employee Jane Smith',
    sourceService: 'server',
    sourceModule: 'employee',
    occurredAt: '2026-03-16T22:00:00.000Z',
  };

  // ---------------------------------------------------------------------------
  // Successful logging
  // ---------------------------------------------------------------------------
  describe('successful logging', () => {
    it('should POST payload to activity-service internal endpoint', async () => {
      const mockResponse: AxiosResponse = {
        data: { id: 'log-123', ...basePayload },
        status: 201,
        statusText: 'Created',
        headers: {},
        config: {} as any,
      };
      httpService.post.mockReturnValue(of(mockResponse));

      await service.log(basePayload);

      expect(httpService.post).toHaveBeenCalledWith(
        'http://localhost:4000/internal/activity-logs',
        basePayload,
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'test-api-key',
          },
          timeout: 5000,
        }),
      );
    });

    it('should not throw on successful delivery', async () => {
      httpService.post.mockReturnValue(of({ data: {}, status: 201 }));

      await expect(service.log(basePayload)).resolves.toBeUndefined();
    });

    it('should send auth login success payload correctly', async () => {
      httpService.post.mockReturnValue(of({ data: {}, status: 201 }));

      const loginPayload = {
        accountId: 'aaaa-aaaa',
        actorUserId: 'uuuu-uuuu',
        actorType: ActorType.USER,
        actorLabel: 'john@example.com',
        action: 'auth.login.succeeded',
        category: ActivityCategory.AUTH,
        sourceService: 'server',
        sourceModule: 'auth',
        ipAddress: '203.0.113.42',
        userAgent: 'Mozilla/5.0',
        isSensitive: true,
        occurredAt: '2026-03-16T22:00:00.000Z',
      };

      await service.log(loginPayload);

      expect(httpService.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          action: 'auth.login.succeeded',
          isSensitive: true,
        }),
        expect.any(Object),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Best-effort: failures must not propagate
  // ---------------------------------------------------------------------------
  describe('best-effort error handling', () => {
    it('should catch and log network errors without throwing', async () => {
      const error = new Error('ECONNREFUSED');
      httpService.post.mockReturnValue(throwError(() => error));

      await expect(service.log(basePayload)).resolves.toBeUndefined();

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Failed to send activity log [employee.created]',
        ),
        expect.any(String),
      );
    });

    it('should catch and log timeout errors without throwing', async () => {
      const error = new Error('timeout of 5000ms exceeded');
      httpService.post.mockReturnValue(throwError(() => error));

      await expect(service.log(basePayload)).resolves.toBeUndefined();

      expect(loggerErrorSpy).toHaveBeenCalled();
    });

    it('should catch and log HTTP 500 errors without throwing', async () => {
      const error = {
        message: 'Request failed with status code 500',
        response: { status: 500 },
      };
      httpService.post.mockReturnValue(throwError(() => error));

      await expect(service.log(basePayload)).resolves.toBeUndefined();

      expect(loggerErrorSpy).toHaveBeenCalled();
    });

    it('should catch and log HTTP 401 (bad API key) errors without throwing', async () => {
      const error = {
        message: 'Request failed with status code 401',
        response: { status: 401 },
      };
      httpService.post.mockReturnValue(throwError(() => error));

      await expect(service.log(basePayload)).resolves.toBeUndefined();

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('401'),
        undefined,
      );
    });

    it('should include action name in error log for debugging', async () => {
      const error = new Error('Connection reset');
      httpService.post.mockReturnValue(throwError(() => error));

      await service.log({
        ...basePayload,
        action: 'permission-role.assigned',
      });

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('permission-role.assigned'),
        expect.anything(),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Missing configuration
  // ---------------------------------------------------------------------------
  describe('missing configuration', () => {
    it('should skip logging when baseUrl is not configured', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ActivityClientService,
          { provide: HttpService, useValue: { post: jest.fn() } },
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn().mockReturnValue({ baseUrl: '', apiKey: 'key' }),
            },
          },
        ],
      }).compile();

      const unconfiguredService = module.get<ActivityClientService>(
        ActivityClientService,
      );
      const warnSpy = jest
        .spyOn((unconfiguredService as any).logger, 'warn')
        .mockImplementation();

      await unconfiguredService.log(basePayload);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('not configured'),
      );
      expect(httpService.post).not.toHaveBeenCalled();
    });

    it('should skip logging when config object is null', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ActivityClientService,
          { provide: HttpService, useValue: { post: jest.fn() } },
          {
            provide: ConfigService,
            useValue: { get: jest.fn().mockReturnValue(null) },
          },
        ],
      }).compile();

      const unconfiguredService = module.get<ActivityClientService>(
        ActivityClientService,
      );
      jest
        .spyOn((unconfiguredService as any).logger, 'warn')
        .mockImplementation();

      await expect(
        unconfiguredService.log(basePayload),
      ).resolves.toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Real-world scenario payloads
  // ---------------------------------------------------------------------------
  describe('real-world scenarios', () => {
    beforeEach(() => {
      httpService.post.mockReturnValue(of({ data: {}, status: 201 }));
    });

    it('should send employee update with field diffs', async () => {
      await service.log({
        accountId: 'aaaa-aaaa',
        companyId: 'cccc-cccc',
        actorUserId: 'uuuu-uuuu',
        actorType: ActorType.USER,
        actorLabel: 'John Doe',
        action: 'employee.updated',
        category: ActivityCategory.EMPLOYEE,
        targetEntityType: 'employee',
        targetEntityId: 'eeee-eeee',
        targetEntityLabel: 'Jane Smith',
        description: 'Updated employee department and title',
        changes: {
          fields: [
            { field: 'department', before: 'Sales', after: 'Operations' },
            { field: 'title', before: 'Sales Rep', after: 'Ops Manager' },
          ],
        },
        sourceService: 'server',
        sourceModule: 'employee',
        requestId: 'req-abc-123',
        correlationId: 'corr-xyz-456',
        occurredAt: new Date().toISOString(),
      });

      expect(httpService.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          action: 'employee.updated',
          changes: expect.objectContaining({
            fields: expect.arrayContaining([
              expect.objectContaining({ field: 'department' }),
            ]),
          }),
        }),
        expect.any(Object),
      );
    });

    it('should send admin access grant event', async () => {
      await service.log({
        accountId: 'aaaa-aaaa',
        companyId: 'cccc-cccc',
        actorUserId: 'admin-user',
        actorType: ActorType.USER,
        action: 'admin-access.granted',
        category: ActivityCategory.ADMIN_ACCESS,
        targetEntityType: 'user',
        targetEntityId: 'target-user',
        targetEntityLabel: 'Jane Smith',
        description: 'Granted admin access to Jane Smith',
        sourceService: 'server',
        isSensitive: true,
        occurredAt: new Date().toISOString(),
      });

      expect(httpService.post).toHaveBeenCalled();
    });

    it('should send system action without actor user', async () => {
      await service.log({
        actorType: ActorType.SYSTEM,
        actorLabel: 'server',
        action: 'system.cleanup.completed',
        category: ActivityCategory.SYSTEM,
        description: 'Nightly cleanup completed',
        metadata: { deletedRecords: 42, duration: '3.2s' },
        sourceService: 'server',
        occurredAt: new Date().toISOString(),
      });

      expect(httpService.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          actorType: ActorType.SYSTEM,
          actorLabel: 'server',
          metadata: expect.objectContaining({ deletedRecords: 42 }),
        }),
        expect.any(Object),
      );
    });

    it('should send login failure with IP and user agent', async () => {
      await service.log({
        actorType: ActorType.USER,
        actorLabel: 'unknown@example.com',
        action: 'auth.login.failed',
        category: ActivityCategory.AUTH,
        description: 'Login attempt failed for unknown@example.com',
        ipAddress: '203.0.113.42',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        sourceService: 'server',
        sourceModule: 'auth',
        isSensitive: true,
        messageKey: 'activity.auth.login.failed',
        occurredAt: new Date().toISOString(),
      });

      expect(httpService.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          action: 'auth.login.failed',
          ipAddress: '203.0.113.42',
          isSensitive: true,
        }),
        expect.any(Object),
      );
    });
  });
});
