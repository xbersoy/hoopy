import { Test, TestingModule } from '@nestjs/testing';
import { ActivityPayloadBuilderService } from '../../src/activity-client/services/activity-payload-builder.service';
import {
  ActivityCategory,
  ActorType,
} from '../../src/activity-client/constants';

describe('ActivityPayloadBuilderService', () => {
  let builder: ActivityPayloadBuilderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ActivityPayloadBuilderService],
    }).compile();

    builder = module.get<ActivityPayloadBuilderService>(
      ActivityPayloadBuilderService,
    );
  });

  // ---------------------------------------------------------------------------
  // extractContext
  // ---------------------------------------------------------------------------
  describe('extractContext', () => {
    it('should extract full context from authenticated request', () => {
      const req = {
        user: {
          id: 'uuuu-uuuu',
          accountId: 'aaaa-aaaa',
          companyId: 'cccc-cccc',
        },
        ip: '192.168.1.1',
        socket: { remoteAddress: '192.168.1.2' },
        headers: {
          'user-agent': 'Mozilla/5.0',
          'x-request-id': 'req-123',
          'x-correlation-id': 'corr-456',
        },
      } as any;

      const context = builder.extractContext(req);

      expect(context).toEqual({
        actorUserId: 'uuuu-uuuu',
        accountId: 'aaaa-aaaa',
        companyId: 'cccc-cccc',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        requestId: 'req-123',
        correlationId: 'corr-456',
      });
    });

    it('should fall back to socket.remoteAddress when ip is undefined', () => {
      const req = {
        user: { id: 'uuuu-uuuu' },
        ip: undefined,
        socket: { remoteAddress: '10.0.0.1' },
        headers: {},
      } as any;

      const context = builder.extractContext(req);

      expect(context.ipAddress).toBe('10.0.0.1');
    });

    it('should handle missing optional headers gracefully', () => {
      const req = {
        user: { id: 'uuuu-uuuu' },
        ip: '127.0.0.1',
        socket: {},
        headers: {},
      } as any;

      const context = builder.extractContext(req);

      expect(context.userAgent).toBeUndefined();
      expect(context.requestId).toBeUndefined();
      expect(context.correlationId).toBeUndefined();
    });

    it('should handle user with no accountId/companyId', () => {
      const req = {
        user: { id: 'uuuu-uuuu', email: 'john@example.com' },
        ip: '127.0.0.1',
        socket: {},
        headers: {},
      } as any;

      const context = builder.extractContext(req);

      expect(context.accountId).toBeUndefined();
      expect(context.companyId).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // build
  // ---------------------------------------------------------------------------
  describe('build', () => {
    const context = {
      actorUserId: 'uuuu-uuuu',
      accountId: 'aaaa-aaaa',
      companyId: 'cccc-cccc',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      requestId: 'req-123',
      correlationId: 'corr-456',
    };

    it('should build a complete payload merging context and event params', () => {
      const payload = builder.build(context, {
        action: 'employee.created',
        category: ActivityCategory.EMPLOYEE,
        sourceModule: 'employee',
        targetEntityType: 'employee',
        targetEntityId: 'eeee-eeee',
        targetEntityLabel: 'Jane Smith',
        description: 'Created employee Jane Smith',
      });

      expect(payload).toEqual(
        expect.objectContaining({
          accountId: 'aaaa-aaaa',
          companyId: 'cccc-cccc',
          actorUserId: 'uuuu-uuuu',
          actorType: ActorType.USER,
          action: 'employee.created',
          category: ActivityCategory.EMPLOYEE,
          targetEntityType: 'employee',
          targetEntityId: 'eeee-eeee',
          targetEntityLabel: 'Jane Smith',
          sourceService: 'server',
          sourceModule: 'employee',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          requestId: 'req-123',
          correlationId: 'corr-456',
        }),
      );
      expect(payload.occurredAt).toBeDefined();
    });

    it('should default actorType to USER when not specified', () => {
      const payload = builder.build(context, {
        action: 'employee.created',
        category: ActivityCategory.EMPLOYEE,
      });

      expect(payload.actorType).toBe(ActorType.USER);
    });

    it('should allow overriding actorType', () => {
      const payload = builder.build(context, {
        action: 'system.cleanup',
        category: ActivityCategory.SYSTEM,
        actorType: ActorType.SYSTEM,
        actorLabel: 'scheduler',
      });

      expect(payload.actorType).toBe(ActorType.SYSTEM);
      expect(payload.actorLabel).toBe('scheduler');
    });

    it('should include changes when provided', () => {
      const changes = {
        fields: [
          { field: 'department', before: 'Sales', after: 'Operations' },
        ],
      };

      const payload = builder.build(context, {
        action: 'employee.updated',
        category: ActivityCategory.EMPLOYEE,
        changes,
      });

      expect(payload.changes).toEqual(changes);
    });

    it('should include metadata when provided', () => {
      const metadata = { roleName: 'HR Manager', roleId: 'role-123' };

      const payload = builder.build(context, {
        action: 'permission-role.assigned',
        category: ActivityCategory.PERMISSIONS,
        metadata,
      });

      expect(payload.metadata).toEqual(metadata);
    });

    it('should set isSensitive flag', () => {
      const payload = builder.build(context, {
        action: 'auth.login.succeeded',
        category: ActivityCategory.AUTH,
        isSensitive: true,
      });

      expect(payload.isSensitive).toBe(true);
    });

    it('should set messageKey for localization', () => {
      const payload = builder.build(context, {
        action: 'employee.created',
        category: ActivityCategory.EMPLOYEE,
        messageKey: 'activity.employee.created',
      });

      expect(payload.messageKey).toBe('activity.employee.created');
    });

    it('should always set sourceService to "server"', () => {
      const payload = builder.build(context, {
        action: 'employee.created',
        category: ActivityCategory.EMPLOYEE,
      });

      expect(payload.sourceService).toBe('server');
    });

    it('should set occurredAt to a valid ISO string', () => {
      const before = new Date().toISOString();
      const payload = builder.build(context, {
        action: 'employee.created',
        category: ActivityCategory.EMPLOYEE,
      });
      const after = new Date().toISOString();

      expect(payload.occurredAt).toBeDefined();
      expect(payload.occurredAt! >= before).toBe(true);
      expect(payload.occurredAt! <= after).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // buildSystemAction
  // ---------------------------------------------------------------------------
  describe('buildSystemAction', () => {
    it('should build system action with SYSTEM actor type', () => {
      const payload = builder.buildSystemAction({
        action: 'system.cleanup.completed',
        category: ActivityCategory.SYSTEM,
        description: 'Nightly cleanup completed',
        metadata: { deletedRecords: 42 },
      });

      expect(payload).toEqual(
        expect.objectContaining({
          actorType: ActorType.SYSTEM,
          actorLabel: 'server',
          action: 'system.cleanup.completed',
          category: ActivityCategory.SYSTEM,
          sourceService: 'server',
          description: 'Nightly cleanup completed',
          metadata: { deletedRecords: 42 },
        }),
      );
    });

    it('should not include user-specific context fields', () => {
      const payload = builder.buildSystemAction({
        action: 'system.cleanup.completed',
        category: ActivityCategory.SYSTEM,
      });

      expect(payload.actorUserId).toBeUndefined();
      expect(payload.ipAddress).toBeUndefined();
      expect(payload.userAgent).toBeUndefined();
      expect(payload.requestId).toBeUndefined();
      expect(payload.correlationId).toBeUndefined();
    });

    it('should include accountId and companyId when provided', () => {
      const payload = builder.buildSystemAction({
        action: 'system.data-sync',
        category: ActivityCategory.SYSTEM,
        accountId: 'aaaa-aaaa',
        companyId: 'cccc-cccc',
      });

      expect(payload.accountId).toBe('aaaa-aaaa');
      expect(payload.companyId).toBe('cccc-cccc');
    });

    it('should set occurredAt to a valid ISO string', () => {
      const payload = builder.buildSystemAction({
        action: 'system.cleanup',
        category: ActivityCategory.SYSTEM,
      });

      expect(payload.occurredAt).toBeDefined();
      expect(() => new Date(payload.occurredAt!)).not.toThrow();
    });

    it('should include target entity info for system actions on entities', () => {
      const payload = builder.buildSystemAction({
        action: 'employee.bulk-import.completed',
        category: ActivityCategory.EMPLOYEE,
        companyId: 'cccc-cccc',
        metadata: { totalProcessed: 100, successCount: 98, failedCount: 2 },
        sourceModule: 'employee',
      });

      expect(payload.sourceModule).toBe('employee');
      expect(payload.metadata).toEqual(
        expect.objectContaining({ totalProcessed: 100 }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Real-world integration scenarios
  // ---------------------------------------------------------------------------
  describe('real-world scenarios', () => {
    const userContext = {
      actorUserId: 'uuuu-uuuu',
      accountId: 'aaaa-aaaa',
      companyId: 'cccc-cccc',
      ipAddress: '203.0.113.42',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      requestId: 'req-abc',
      correlationId: 'corr-xyz',
    };

    it('should build auth login success payload', () => {
      const payload = builder.build(userContext, {
        action: 'auth.login.succeeded',
        category: ActivityCategory.AUTH,
        sourceModule: 'auth',
        description: 'User logged in successfully',
        isSensitive: true,
        messageKey: 'activity.auth.login.succeeded',
      });

      expect(payload.action).toBe('auth.login.succeeded');
      expect(payload.category).toBe(ActivityCategory.AUTH);
      expect(payload.isSensitive).toBe(true);
      expect(payload.sourceModule).toBe('auth');
    });

    it('should build employee create with target entity payload', () => {
      const payload = builder.build(userContext, {
        action: 'employee.created',
        category: ActivityCategory.EMPLOYEE,
        sourceModule: 'employee',
        targetEntityType: 'employee',
        targetEntityId: 'new-emp-id',
        targetEntityLabel: 'Jane Smith',
        description: 'Created employee Jane Smith',
        messageKey: 'activity.employee.created',
      });

      expect(payload.targetEntityType).toBe('employee');
      expect(payload.targetEntityId).toBe('new-emp-id');
      expect(payload.targetEntityLabel).toBe('Jane Smith');
    });

    it('should build permission role assignment with metadata', () => {
      const payload = builder.build(userContext, {
        action: 'permission-role.assigned',
        category: ActivityCategory.PERMISSIONS,
        sourceModule: 'permissions',
        targetEntityType: 'user',
        targetEntityId: 'target-user-id',
        targetEntityLabel: 'Jane Smith',
        description: 'Assigned HR Manager role to Jane Smith',
        metadata: {
          roleName: 'HR Manager',
          roleId: 'role-123',
        },
      });

      expect(payload.metadata).toEqual({
        roleName: 'HR Manager',
        roleId: 'role-123',
      });
    });

    it('should build company update with field diffs', () => {
      const payload = builder.build(userContext, {
        action: 'company.updated',
        category: ActivityCategory.COMPANY,
        sourceModule: 'company',
        targetEntityType: 'company',
        targetEntityId: 'cccc-cccc',
        targetEntityLabel: 'Acme Corp',
        changes: {
          fields: [
            { field: 'name', before: 'Acme Inc', after: 'Acme Corp' },
            { field: 'sector', before: 'Technology', after: 'SaaS' },
          ],
        },
      });

      expect(payload.changes!.fields).toHaveLength(2);
      expect(payload.changes!.fields[0].field).toBe('name');
    });
  });
});
