import { Test, TestingModule } from '@nestjs/testing';
import { LeaveBalanceService } from '@/leave/services/leave-balance.service';
import { LeaveGrantService } from '@/leave/services/leave-grant.service';
import { BalanceTransactionType, BalanceActorType, GrantSourceType } from '@/leave/enums/leave.enums';

describe('LeaveBalanceService', () => {
  let service: LeaveBalanceService;
  let ledgerRepo: jest.Mocked<any>;
  let grantRepo: jest.Mocked<any>;
  let grantService: jest.Mocked<any>;

  const mockGrant = {
    id: 'grant-1',
    companyId: 'comp-1',
    employeeId: 'emp-1',
    leaveTypeId: 'lt-1',
    grantedAmount: 14,
    consumedAmount: 0,
    reservedAmount: 0,
    remainingAmount: 14,
  };

  const mockLedgerEntry = {
    id: 'ledger-1',
    companyId: 'comp-1',
    employeeId: 'emp-1',
    leaveTypeId: 'lt-1',
    leaveGrantId: 'grant-1',
    transactionType: BalanceTransactionType.GRANT,
    amount: 14,
    occurredAt: new Date(),
    effectiveDate: new Date(),
    actorType: BalanceActorType.SYSTEM,
  };

  beforeEach(async () => {
    ledgerRepo = {
      create: jest.fn().mockImplementation((data) => data),
      save: jest.fn().mockImplementation((entity) =>
        Promise.resolve({ id: 'ledger-new', ...entity }),
      ),
      findByEmployee: jest.fn().mockResolvedValue([]),
      findByGrant: jest.fn().mockResolvedValue([mockLedgerEntry]),
    };

    grantRepo = {
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    grantService = {
      findOne: jest.fn().mockResolvedValue({ ...mockGrant }),
      createGrant: jest.fn().mockResolvedValue({ ...mockGrant, id: 'grant-new' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaveBalanceService,
        { provide: 'LeaveBalanceLedgerRepository', useValue: ledgerRepo },
        { provide: 'LeaveGrantRepository', useValue: grantRepo },
        { provide: LeaveGrantService, useValue: grantService },
      ],
    }).compile();

    service = module.get<LeaveBalanceService>(LeaveBalanceService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── adjust (existing grant) ──

  describe('adjust with existing grant', () => {
    it('should adjust an existing grant and create ledger entry', async () => {
      const result = await service.adjust(
        'comp-1',
        {
          employeeId: 'emp-1',
          leaveTypeId: 'lt-1',
          amount: 3,
          reason: 'Bonus leave days',
          grantId: 'grant-1',
        },
        'hr-user-1',
      );

      expect(grantService.findOne).toHaveBeenCalledWith('grant-1');
      expect(grantRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          grantedAmount: 17, // 14 + 3
          remainingAmount: 17, // 14 + 3
        }),
      );
      expect(ledgerRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionType: BalanceTransactionType.ADJUSTMENT,
          amount: 3,
          actorType: BalanceActorType.HR,
          actorId: 'hr-user-1',
        }),
      );
    });

    it('should handle negative adjustments', async () => {
      await service.adjust(
        'comp-1',
        {
          employeeId: 'emp-1',
          leaveTypeId: 'lt-1',
          amount: -2,
          reason: 'Correction',
          grantId: 'grant-1',
        },
        'hr-user-1',
      );

      expect(grantRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          grantedAmount: 12, // 14 - 2
          remainingAmount: 12,
        }),
      );
    });
  });

  // ── adjust (new manual grant) ──

  describe('adjust without grantId', () => {
    it('should create a new manual grant', async () => {
      await service.adjust(
        'comp-1',
        {
          employeeId: 'emp-1',
          leaveTypeId: 'lt-1',
          amount: 5,
          reason: 'Special allocation',
        },
        'hr-user-1',
      );

      expect(grantService.createGrant).toHaveBeenCalledWith(
        'comp-1',
        expect.objectContaining({
          employeeId: 'emp-1',
          grantedAmount: 5,
          sourceType: GrantSourceType.MANUAL_ADJUSTMENT,
        }),
        'hr-user-1',
      );
    });
  });

  // ── getLedger ──

  describe('getLedger', () => {
    it('should return ledger entries for employee', async () => {
      ledgerRepo.findByEmployee.mockResolvedValue([mockLedgerEntry]);
      const result = await service.getLedger('comp-1', 'emp-1');
      expect(result).toHaveLength(1);
      expect(ledgerRepo.findByEmployee).toHaveBeenCalledWith('comp-1', 'emp-1');
    });
  });
});
