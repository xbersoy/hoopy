import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { LeaveRequestService } from '@/leave/services/leave-request.service';
import { LeaveTypeService } from '@/leave/services/leave-type.service';
import { LeaveRequest } from '@/leave/entities/leave-request.entity';
import {
  LeaveRequestStatus,
  SessionType,
  LeaveUnitType,
  BalanceTransactionType,
  LeaveGrantStatus,
  GrantSourceType,
} from '@/leave/enums/leave.enums';

describe('LeaveRequestService', () => {
  let service: LeaveRequestService;
  let requestRepo: jest.Mocked<any>;
  let segmentRepo: jest.Mocked<any>;
  let grantRepo: jest.Mocked<any>;
  let ledgerRepo: jest.Mocked<any>;
  let leaveTypeService: jest.Mocked<any>;

  const mockLeaveType = {
    id: 'lt-1',
    name: 'Annual Leave',
    unitType: LeaveUnitType.DAY,
    requiresBalance: true,
    requiresAttachment: false,
  };

  const mockGrant = {
    id: 'grant-1',
    employeeId: 'emp-1',
    leaveTypeId: 'lt-1',
    grantedAmount: 14,
    consumedAmount: 0,
    reservedAmount: 0,
    remainingAmount: 14,
    status: LeaveGrantStatus.ACTIVE,
  };

  const mockRequest: LeaveRequest = {
    id: 'req-1',
    companyId: 'comp-1',
    company: null as any,
    employeeId: 'emp-1',
    employee: null as any,
    requesterUserId: 'user-1',
    leaveTypeId: 'lt-1',
    leaveType: mockLeaveType as any,
    matchedPolicyId: null,
    matchedPolicy: null as any,
    status: LeaveRequestStatus.DRAFT,
    startDate: new Date('2026-04-01'),
    endDate: new Date('2026-04-03'),
    startSession: SessionType.FULL_DAY,
    endSession: SessionType.FULL_DAY,
    durationDays: 3,
    reason: 'Vacation',
    policySnapshot: null,
    orgSnapshot: null,
    metadata: null,
    workflowInstanceId: null,
    stateMachineInstanceId: null,
    segments: [],
    versionNo: 1,
    submittedAt: null,
    approvedAt: null,
    rejectedAt: null,
    cancelledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    requestRepo = {
      create: jest.fn().mockImplementation((data) => ({ id: undefined, ...data })),
      save: jest.fn().mockImplementation((entity) =>
        Promise.resolve({ ...entity, id: entity.id || 'req-new' }),
      ),
      findPaginated: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      findOne: jest.fn().mockResolvedValue(null),
      findOverlapping: jest.fn().mockResolvedValue([]),
    };

    segmentRepo = {
      create: jest.fn().mockImplementation((data) => data),
      saveAll: jest.fn().mockImplementation((entities) => Promise.resolve(entities)),
      deleteByRequestId: jest.fn().mockResolvedValue(undefined),
    };

    grantRepo = {
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      findActiveByEmployeeAndType: jest.fn().mockResolvedValue([{ ...mockGrant }]),
    };

    ledgerRepo = {
      create: jest.fn().mockImplementation((data) => data),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    leaveTypeService = {
      findOne: jest.fn().mockResolvedValue(mockLeaveType),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaveRequestService,
        { provide: 'LeaveRequestRepository', useValue: requestRepo },
        { provide: 'LeaveRequestSegmentRepository', useValue: segmentRepo },
        { provide: 'LeaveGrantRepository', useValue: grantRepo },
        { provide: 'LeaveBalanceLedgerRepository', useValue: ledgerRepo },
        { provide: LeaveTypeService, useValue: leaveTypeService },
      ],
    }).compile();

    service = module.get<LeaveRequestService>(LeaveRequestService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ──

  describe('create', () => {
    it('should create a leave request with segments', async () => {
      requestRepo.save.mockResolvedValue({ ...mockRequest, id: 'req-new' });
      requestRepo.findOne.mockResolvedValue({ ...mockRequest, id: 'req-new', segments: [] });

      const result = await service.create('comp-1', 'user-1', {
        employeeId: 'emp-1',
        leaveTypeId: 'lt-1',
        startDate: '2026-04-01',
        endDate: '2026-04-03',
      });

      expect(leaveTypeService.findOne).toHaveBeenCalledWith('lt-1');
      expect(requestRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: 'comp-1',
          employeeId: 'emp-1',
          status: LeaveRequestStatus.DRAFT,
          durationDays: 3,
        }),
      );
      expect(segmentRepo.saveAll).toHaveBeenCalled();
      // 3 segments for 3 days
      expect(segmentRepo.create).toHaveBeenCalledTimes(3);
    });

    it('should throw BadRequestException when start > end', async () => {
      await expect(
        service.create('comp-1', 'user-1', {
          employeeId: 'emp-1',
          leaveTypeId: 'lt-1',
          startDate: '2026-04-05',
          endDate: '2026-04-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for overlapping requests', async () => {
      requestRepo.findOverlapping.mockResolvedValue([mockRequest]);

      await expect(
        service.create('comp-1', 'user-1', {
          employeeId: 'emp-1',
          leaveTypeId: 'lt-1',
          startDate: '2026-04-01',
          endDate: '2026-04-03',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when insufficient balance', async () => {
      grantRepo.findActiveByEmployeeAndType.mockResolvedValue([
        { ...mockGrant, remainingAmount: 1 },
      ]);

      await expect(
        service.create('comp-1', 'user-1', {
          employeeId: 'emp-1',
          leaveTypeId: 'lt-1',
          startDate: '2026-04-01',
          endDate: '2026-04-03',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should skip balance check for types that do not require balance', async () => {
      leaveTypeService.findOne.mockResolvedValue({
        ...mockLeaveType,
        requiresBalance: false,
      });
      grantRepo.findActiveByEmployeeAndType.mockResolvedValue([]);
      requestRepo.save.mockResolvedValue({ ...mockRequest, id: 'req-new' });
      requestRepo.findOne.mockResolvedValue({ ...mockRequest, id: 'req-new' });

      const result = await service.create('comp-1', 'user-1', {
        employeeId: 'emp-1',
        leaveTypeId: 'lt-1',
        startDate: '2026-04-01',
        endDate: '2026-04-01',
      });

      expect(result).toBeDefined();
    });

    it('should calculate half-day duration correctly', async () => {
      requestRepo.save.mockResolvedValue({ ...mockRequest, id: 'req-new' });
      requestRepo.findOne.mockResolvedValue({ ...mockRequest, id: 'req-new' });

      await service.create('comp-1', 'user-1', {
        employeeId: 'emp-1',
        leaveTypeId: 'lt-1',
        startDate: '2026-04-01',
        endDate: '2026-04-01',
        startSession: SessionType.MORNING,
      });

      expect(requestRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ durationDays: 0.5 }),
      );
    });

    it('should handle multi-day half-day start and end', async () => {
      requestRepo.save.mockResolvedValue({ ...mockRequest, id: 'req-new' });
      requestRepo.findOne.mockResolvedValue({ ...mockRequest, id: 'req-new' });

      await service.create('comp-1', 'user-1', {
        employeeId: 'emp-1',
        leaveTypeId: 'lt-1',
        startDate: '2026-04-01',
        endDate: '2026-04-03',
        startSession: SessionType.AFTERNOON,
        endSession: SessionType.MORNING,
      });

      // day 1 = 0.5, day 2 = 1.0, day 3 = 0.5 = 2.0
      expect(requestRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ durationDays: 2 }),
      );
    });
  });

  // ── findPaginated ──

  describe('findPaginated', () => {
    it('should return paginated results', async () => {
      requestRepo.findPaginated.mockResolvedValue({
        data: [mockRequest],
        total: 1,
      });

      const result = await service.findPaginated('comp-1', { page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should use defaults for page and limit', async () => {
      requestRepo.findPaginated.mockResolvedValue({ data: [], total: 0 });

      const result = await service.findPaginated('comp-1', {});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });

  // ── findOne ──

  describe('findOne', () => {
    it('should return a request', async () => {
      requestRepo.findOne.mockResolvedValue(mockRequest);
      const result = await service.findOne('req-1');
      expect(result).toEqual(mockRequest);
    });

    it('should throw NotFoundException', async () => {
      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ── submit ──

  describe('submit', () => {
    it('should submit a draft request and reserve balance', async () => {
      requestRepo.findOne.mockResolvedValue({ ...mockRequest, status: LeaveRequestStatus.DRAFT });
      requestRepo.save.mockResolvedValue({
        ...mockRequest,
        status: LeaveRequestStatus.SUBMITTED,
      });

      const result = await service.submit('req-1', 'user-1');

      expect(grantRepo.findActiveByEmployeeAndType).toHaveBeenCalled();
      expect(grantRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          reservedAmount: 3,
          remainingAmount: 11,
        }),
      );
      expect(ledgerRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionType: BalanceTransactionType.RESERVATION,
          amount: -3,
        }),
      );
    });

    it('should throw for non-draft requests', async () => {
      requestRepo.findOne.mockResolvedValue({
        ...mockRequest,
        status: LeaveRequestStatus.SUBMITTED,
      });

      await expect(service.submit('req-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ── approve ──

  describe('approve', () => {
    it('should approve and consume reserved balance', async () => {
      grantRepo.findActiveByEmployeeAndType.mockResolvedValue([
        { ...mockGrant, reservedAmount: 3, remainingAmount: 11 },
      ]);
      requestRepo.findOne.mockResolvedValue({
        ...mockRequest,
        status: LeaveRequestStatus.SUBMITTED,
      });
      requestRepo.save.mockResolvedValue({
        ...mockRequest,
        status: LeaveRequestStatus.APPROVED,
      });

      const result = await service.approve('req-1', 'user-1');

      expect(grantRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          reservedAmount: 0,
          consumedAmount: 3,
        }),
      );
      expect(ledgerRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionType: BalanceTransactionType.CONSUMPTION,
        }),
      );
    });

    it('should throw for non-submitted requests', async () => {
      requestRepo.findOne.mockResolvedValue({
        ...mockRequest,
        status: LeaveRequestStatus.DRAFT,
      });

      await expect(service.approve('req-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ── reject ──

  describe('reject', () => {
    it('should reject and release reserved balance', async () => {
      grantRepo.findActiveByEmployeeAndType.mockResolvedValue([
        { ...mockGrant, reservedAmount: 3, remainingAmount: 11 },
      ]);
      requestRepo.findOne.mockResolvedValue({
        ...mockRequest,
        status: LeaveRequestStatus.SUBMITTED,
      });
      requestRepo.save.mockResolvedValue({
        ...mockRequest,
        status: LeaveRequestStatus.REJECTED,
      });

      const result = await service.reject('req-1', 'user-1');

      expect(grantRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          reservedAmount: 0,
          remainingAmount: 14,
        }),
      );
      expect(ledgerRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionType: BalanceTransactionType.RELEASE,
          amount: 3,
        }),
      );
    });

    it('should throw for non-submitted requests', async () => {
      requestRepo.findOne.mockResolvedValue({
        ...mockRequest,
        status: LeaveRequestStatus.APPROVED,
      });

      await expect(service.reject('req-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ── cancel ──

  describe('cancel', () => {
    it('should cancel a draft request without balance changes', async () => {
      requestRepo.findOne.mockResolvedValue({
        ...mockRequest,
        status: LeaveRequestStatus.DRAFT,
      });
      requestRepo.save.mockResolvedValue({
        ...mockRequest,
        status: LeaveRequestStatus.CANCELLED,
      });

      await service.cancel('req-1', 'user-1');

      // No balance operations for draft
      expect(grantRepo.findActiveByEmployeeAndType).not.toHaveBeenCalled();
    });

    it('should cancel a submitted request and release balance', async () => {
      grantRepo.findActiveByEmployeeAndType.mockResolvedValue([
        { ...mockGrant, reservedAmount: 3, remainingAmount: 11 },
      ]);
      requestRepo.findOne.mockResolvedValue({
        ...mockRequest,
        status: LeaveRequestStatus.SUBMITTED,
      });
      requestRepo.save.mockResolvedValue({
        ...mockRequest,
        status: LeaveRequestStatus.CANCELLED,
      });

      await service.cancel('req-1', 'user-1');

      expect(ledgerRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionType: BalanceTransactionType.RELEASE,
        }),
      );
    });

    it('should cancel an approved request and reverse consumed balance', async () => {
      grantRepo.findActiveByEmployeeAndType.mockResolvedValue([
        { ...mockGrant, consumedAmount: 3, remainingAmount: 11 },
      ]);
      requestRepo.findOne.mockResolvedValue({
        ...mockRequest,
        status: LeaveRequestStatus.APPROVED,
      });
      requestRepo.save.mockResolvedValue({
        ...mockRequest,
        status: LeaveRequestStatus.CANCELLED,
      });

      await service.cancel('req-1', 'user-1');

      expect(ledgerRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionType: BalanceTransactionType.REVERSAL,
          amount: 3,
        }),
      );
    });

    it('should throw for rejected requests', async () => {
      requestRepo.findOne.mockResolvedValue({
        ...mockRequest,
        status: LeaveRequestStatus.REJECTED,
      });

      await expect(service.cancel('req-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
