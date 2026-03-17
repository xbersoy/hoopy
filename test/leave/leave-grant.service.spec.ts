import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { LeaveGrantService } from '@/leave/services/leave-grant.service';
import { LeaveGrant } from '@/leave/entities/leave-grant.entity';
import {
  LeaveGrantStatus,
  GrantSourceType,
  BalanceTransactionType,
  BalanceActorType,
} from '@/leave/enums/leave.enums';

describe('LeaveGrantService', () => {
  let service: LeaveGrantService;
  let grantRepo: jest.Mocked<any>;
  let ledgerRepo: jest.Mocked<any>;

  const mockGrant: LeaveGrant = {
    id: 'grant-1',
    companyId: 'comp-1',
    company: null as any,
    employeeId: 'emp-1',
    employee: null as any,
    leaveTypeId: 'lt-1',
    leaveType: { id: 'lt-1', name: 'Annual Leave' } as any,
    leavePolicyId: 'pol-1',
    leavePolicy: null as any,
    entitlementRuleId: 'rule-1',
    entitlementRule: null as any,
    grantReason: 'Annual entitlement',
    grantedAmount: 14,
    consumedAmount: 0,
    reservedAmount: 0,
    remainingAmount: 14,
    validFrom: new Date('2026-01-01'),
    validUntil: new Date('2026-12-31'),
    grantedAt: new Date(),
    sourceType: GrantSourceType.ENTITLEMENT_RULE,
    status: LeaveGrantStatus.ACTIVE,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    grantRepo = {
      create: jest.fn().mockImplementation((data) => ({ id: undefined, ...data })),
      save: jest.fn().mockImplementation((entity) =>
        Promise.resolve({ ...entity, id: entity.id || 'grant-new' }),
      ),
      findByEmployee: jest.fn().mockResolvedValue([]),
      findActiveByEmployeeAndType: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
    };

    ledgerRepo = {
      create: jest.fn().mockImplementation((data) => data),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      findByEmployee: jest.fn().mockResolvedValue([]),
      findByGrant: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaveGrantService,
        { provide: 'LeaveGrantRepository', useValue: grantRepo },
        { provide: 'LeaveBalanceLedgerRepository', useValue: ledgerRepo },
      ],
    }).compile();

    service = module.get<LeaveGrantService>(LeaveGrantService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── createGrant ──

  describe('createGrant', () => {
    it('should create a grant and write a ledger entry', async () => {
      grantRepo.save.mockResolvedValue({ ...mockGrant, id: 'grant-new' });

      const result = await service.createGrant('comp-1', {
        employeeId: 'emp-1',
        leaveTypeId: 'lt-1',
        leavePolicyId: 'pol-1',
        grantedAmount: 14,
        validFrom: new Date('2026-01-01'),
        validUntil: new Date('2026-12-31'),
        sourceType: GrantSourceType.ENTITLEMENT_RULE,
      });

      expect(grantRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: 'comp-1',
          grantedAmount: 14,
          remainingAmount: 14,
          consumedAmount: 0,
          reservedAmount: 0,
          status: LeaveGrantStatus.ACTIVE,
        }),
      );
      expect(grantRepo.save).toHaveBeenCalled();
      expect(ledgerRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionType: BalanceTransactionType.GRANT,
          amount: 14,
          actorType: BalanceActorType.SYSTEM,
        }),
      );
      expect(ledgerRepo.save).toHaveBeenCalled();
    });

    it('should set actor to HR when actorId is provided', async () => {
      grantRepo.save.mockResolvedValue({ ...mockGrant });

      await service.createGrant(
        'comp-1',
        {
          employeeId: 'emp-1',
          leaveTypeId: 'lt-1',
          grantedAmount: 5,
          validFrom: new Date(),
          sourceType: GrantSourceType.MANUAL_ADJUSTMENT,
        },
        'hr-user-1',
      );

      expect(ledgerRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actorType: BalanceActorType.HR,
          actorId: 'hr-user-1',
        }),
      );
    });
  });

  // ── findByEmployee ──

  describe('findByEmployee', () => {
    it('should return grants for employee', async () => {
      grantRepo.findByEmployee.mockResolvedValue([mockGrant]);
      const result = await service.findByEmployee('comp-1', 'emp-1');
      expect(result).toHaveLength(1);
    });
  });

  // ── findActiveByEmployeeAndType ──

  describe('findActiveByEmployeeAndType', () => {
    it('should return active grants with remaining balance', async () => {
      grantRepo.findActiveByEmployeeAndType.mockResolvedValue([mockGrant]);
      const result = await service.findActiveByEmployeeAndType('emp-1', 'lt-1');
      expect(result).toHaveLength(1);
    });

    it('should use current date when no asOfDate provided', async () => {
      await service.findActiveByEmployeeAndType('emp-1', 'lt-1');
      expect(grantRepo.findActiveByEmployeeAndType).toHaveBeenCalledWith(
        'emp-1',
        'lt-1',
        expect.any(Date),
      );
    });
  });

  // ── findOne ──

  describe('findOne', () => {
    it('should return a grant', async () => {
      grantRepo.findOne.mockResolvedValue(mockGrant);
      const result = await service.findOne('grant-1');
      expect(result).toEqual(mockGrant);
    });

    it('should throw NotFoundException', async () => {
      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ── getBalanceSummary ──

  describe('getBalanceSummary', () => {
    it('should aggregate balances by leave type', async () => {
      grantRepo.findByEmployee.mockResolvedValue([
        { ...mockGrant, grantedAmount: 14, consumedAmount: 3, reservedAmount: 2, remainingAmount: 9 },
        { ...mockGrant, id: 'grant-2', grantedAmount: 5, consumedAmount: 0, reservedAmount: 0, remainingAmount: 5, grantReason: 'Carryover' },
      ]);

      const result = await service.getBalanceSummary('comp-1', 'emp-1');
      expect(result).toHaveLength(1);
      expect(result[0].totalGranted).toBe(19);
      expect(result[0].totalConsumed).toBe(3);
      expect(result[0].totalReserved).toBe(2);
      expect(result[0].totalRemaining).toBe(14);
    });

    it('should exclude cancelled grants', async () => {
      grantRepo.findByEmployee.mockResolvedValue([
        { ...mockGrant, status: LeaveGrantStatus.CANCELLED, grantedAmount: 14, consumedAmount: 0, reservedAmount: 0, remainingAmount: 14 },
      ]);

      const result = await service.getBalanceSummary('comp-1', 'emp-1');
      expect(result).toHaveLength(0);
    });

    it('should group by leave type', async () => {
      grantRepo.findByEmployee.mockResolvedValue([
        { ...mockGrant, leaveTypeId: 'lt-1', leaveType: { name: 'Annual' }, grantedAmount: 14, consumedAmount: 0, reservedAmount: 0, remainingAmount: 14 },
        { ...mockGrant, id: 'g2', leaveTypeId: 'lt-2', leaveType: { name: 'Sick' }, grantedAmount: 10, consumedAmount: 0, reservedAmount: 0, remainingAmount: 10 },
      ]);

      const result = await service.getBalanceSummary('comp-1', 'emp-1');
      expect(result).toHaveLength(2);
    });
  });
});
