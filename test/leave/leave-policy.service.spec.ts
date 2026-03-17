import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { LeavePolicyService } from '@/leave/services/leave-policy.service';
import { LeavePolicy } from '@/leave/entities/leave-policy.entity';
import { GrantStrategy, GrantTrigger, CarryoverStrategy, ExpiryStrategy, ConsumptionStrategy } from '@/leave/enums/leave.enums';

describe('LeavePolicyService', () => {
  let service: LeavePolicyService;
  let policyRepo: jest.Mocked<any>;
  let ruleRepo: jest.Mocked<any>;
  let i18nRepo: jest.Mocked<any>;

  const mockPolicy: LeavePolicy = {
    id: 'pol-1',
    companyId: 'comp-1',
    company: null as any,
    leaveTypeId: 'lt-1',
    leaveType: null as any,
    code: 'standard_annual',
    name: 'Standard Annual Leave',
    description: 'Standard policy',
    priority: 0,
    isActive: true,
    effectiveStartDate: null,
    effectiveEndDate: null,
    metadata: null,
    translations: [],
    entitlementRules: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    policyRepo = {
      create: jest.fn().mockImplementation((data) => ({ id: undefined, ...data })),
      save: jest.fn().mockImplementation((entity) =>
        Promise.resolve({ ...entity, id: entity.id || 'pol-new' }),
      ),
      findByCompany: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      findByLeaveType: jest.fn().mockResolvedValue([]),
      remove: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    ruleRepo = {
      create: jest.fn().mockImplementation((data) => data),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      saveAll: jest.fn().mockImplementation((entities) => Promise.resolve(entities)),
      findByPolicy: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      deleteByPolicyId: jest.fn().mockResolvedValue(undefined),
    };

    i18nRepo = {
      upsert: jest.fn().mockResolvedValue(undefined),
      findByEntity: jest.fn().mockResolvedValue([]),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeavePolicyService,
        { provide: 'LeavePolicyRepository', useValue: policyRepo },
        { provide: 'LeaveEntitlementRuleRepository', useValue: ruleRepo },
        { provide: 'LeavePolicyI18nRepository', useValue: i18nRepo },
      ],
    }).compile();

    service = module.get<LeavePolicyService>(LeavePolicyService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ──

  describe('create', () => {
    it('should create a policy without entitlement rules', async () => {
      policyRepo.save.mockResolvedValue({ ...mockPolicy, id: 'pol-new' });
      policyRepo.findOne.mockResolvedValue({ ...mockPolicy, id: 'pol-new' });

      const result = await service.create('comp-1', {
        leaveTypeId: 'lt-1',
        code: 'standard_annual',
        name: 'Standard Annual Leave',
      });

      expect(policyRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ companyId: 'comp-1', code: 'standard_annual' }),
      );
      expect(ruleRepo.saveAll).not.toHaveBeenCalled();
      expect(result.id).toBe('pol-new');
    });

    it('should create a policy with entitlement rules', async () => {
      policyRepo.save.mockResolvedValue({ ...mockPolicy, id: 'pol-new' });
      policyRepo.findOne.mockResolvedValue({
        ...mockPolicy,
        id: 'pol-new',
        entitlementRules: [{ id: 'rule-1', name: '14 days yearly' }],
      });

      const result = await service.create('comp-1', {
        leaveTypeId: 'lt-1',
        code: 'standard_annual',
        name: 'Standard Annual Leave',
        entitlementRules: [
          {
            name: '14 days yearly',
            grantStrategy: GrantStrategy.RECURRING,
            grantAmount: 14,
            grantTrigger: GrantTrigger.CALENDAR_YEAR_START,
          },
        ],
      });

      expect(ruleRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ leavePolicyId: 'pol-new', name: '14 days yearly' }),
      );
      expect(ruleRepo.saveAll).toHaveBeenCalledTimes(1);
      expect(result.entitlementRules).toHaveLength(1);
    });

    it('should convert date strings to Date objects', async () => {
      policyRepo.save.mockResolvedValue({ ...mockPolicy, id: 'pol-new' });
      policyRepo.findOne.mockResolvedValue({ ...mockPolicy, id: 'pol-new' });

      await service.create('comp-1', {
        leaveTypeId: 'lt-1',
        code: 'test',
        name: 'Test',
        effectiveStartDate: '2026-01-01',
        effectiveEndDate: '2026-12-31',
      });

      expect(policyRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          effectiveStartDate: new Date('2026-01-01'),
          effectiveEndDate: new Date('2026-12-31'),
        }),
      );
    });
  });

  // ── findAll ──

  describe('findAll', () => {
    it('should return policies for company', async () => {
      policyRepo.findByCompany.mockResolvedValue([mockPolicy]);
      const result = await service.findAll('comp-1');
      expect(result).toHaveLength(1);
    });
  });

  // ── findOne ──

  describe('findOne', () => {
    it('should return a policy by id', async () => {
      policyRepo.findOne.mockResolvedValue(mockPolicy);
      const result = await service.findOne('pol-1');
      expect(result).toEqual(mockPolicy);
    });

    it('should throw NotFoundException when not found', async () => {
      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ── update ──

  describe('update', () => {
    it('should update policy fields', async () => {
      policyRepo.findOne
        .mockResolvedValueOnce({ ...mockPolicy })
        .mockResolvedValueOnce({ ...mockPolicy, name: 'Updated' });
      policyRepo.save.mockResolvedValue({ ...mockPolicy, name: 'Updated' });

      const result = await service.update('pol-1', { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });

    it('should replace entitlement rules when provided', async () => {
      policyRepo.findOne
        .mockResolvedValueOnce({ ...mockPolicy })
        .mockResolvedValueOnce({ ...mockPolicy, entitlementRules: [{ id: 'new-rule' }] });

      await service.update('pol-1', {
        entitlementRules: [
          {
            name: 'New rule',
            grantStrategy: GrantStrategy.ONE_TIME,
            grantAmount: 7,
            grantTrigger: GrantTrigger.EMPLOYMENT_START,
          },
        ],
      });

      expect(ruleRepo.deleteByPolicyId).toHaveBeenCalledWith('pol-1');
      expect(ruleRepo.saveAll).toHaveBeenCalled();
    });

    it('should not touch rules when not in update payload', async () => {
      policyRepo.findOne
        .mockResolvedValueOnce({ ...mockPolicy })
        .mockResolvedValueOnce({ ...mockPolicy, name: 'Updated' });

      await service.update('pol-1', { name: 'Updated' });
      expect(ruleRepo.deleteByPolicyId).not.toHaveBeenCalled();
    });
  });

  // ── remove ──

  describe('remove', () => {
    it('should remove a policy', async () => {
      policyRepo.findOne.mockResolvedValue({ ...mockPolicy });
      const result = await service.remove('pol-1');
      expect(policyRepo.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent policy', async () => {
      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
