import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TimesheetService } from '@/time-management/timesheets/services/timesheet.service';
import { TimesheetStatus } from '@/time-management/timesheets/enums/timesheet.enums';

describe('TimesheetService', () => {
  let service: TimesheetService;
  let periodRepo: jest.Mocked<any>;
  let entryRepo: jest.Mocked<any>;

  const mockPeriod = {
    id: 'ts-1',
    companyId: 'comp-1',
    employeeId: 'emp-1',
    periodStart: new Date('2025-06-01'),
    periodEnd: new Date('2025-06-15'),
    status: TimesheetStatus.DRAFT,
    totalWorkedMinutes: 0,
    totalOvertimeMinutes: 0,
    submittedAt: null,
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectionReason: null,
    isLocked: false,
    workflowInstanceId: null,
    stateMachineInstanceId: null,
    metadata: null,
    entries: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    periodRepo = {
      create: jest
        .fn()
        .mockImplementation((data) => ({ id: undefined, ...data })),
      save: jest
        .fn()
        .mockImplementation((entity) =>
          Promise.resolve({ ...entity, id: entity.id || 'ts-new' }),
        ),
      findOne: jest.fn().mockResolvedValue(null),
      findPaginated: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      findOverlapping: jest.fn().mockResolvedValue([]),
      remove: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    entryRepo = {
      create: jest.fn().mockImplementation((data) => data),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      saveAll: jest
        .fn()
        .mockImplementation((entities) => Promise.resolve(entities)),
      findByPeriodId: jest.fn().mockResolvedValue([]),
      deleteByPeriodId: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimesheetService,
        { provide: 'TimesheetPeriodRepository', useValue: periodRepo },
        { provide: 'TimesheetEntryRepository', useValue: entryRepo },
      ],
    }).compile();

    service = module.get<TimesheetService>(TimesheetService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ──

  describe('create', () => {
    it('should create a DRAFT period', async () => {
      await service.create('comp-1', {
        employeeId: 'emp-1',
        periodStart: '2025-06-01',
        periodEnd: '2025-06-15',
      } as any);

      expect(periodRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: 'comp-1',
          employeeId: 'emp-1',
          status: TimesheetStatus.DRAFT,
        }),
      );
      expect(periodRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if overlapping period exists', async () => {
      periodRepo.findOverlapping.mockResolvedValue([mockPeriod]);

      await expect(
        service.create('comp-1', {
          employeeId: 'emp-1',
          periodStart: '2025-06-01',
          periodEnd: '2025-06-15',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── findOne ──

  describe('findOne', () => {
    it('should return a period by id', async () => {
      periodRepo.findOne.mockResolvedValue(mockPeriod);
      const result = await service.findOne('ts-1');
      expect(result).toEqual(mockPeriod);
    });

    it('should throw NotFoundException when not found', async () => {
      await expect(service.findOne('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── submit ──

  describe('submit', () => {
    it('should move DRAFT → SUBMITTED', async () => {
      periodRepo.findOne.mockResolvedValue({
        ...mockPeriod,
        status: TimesheetStatus.DRAFT,
      });
      periodRepo.save.mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.submit('ts-1');
      expect(result.status).toBe(TimesheetStatus.SUBMITTED);
      expect(result.submittedAt).toBeDefined();
    });

    it('should allow CORRECTION_REQUESTED → SUBMITTED', async () => {
      periodRepo.findOne.mockResolvedValue({
        ...mockPeriod,
        status: TimesheetStatus.CORRECTION_REQUESTED,
      });
      periodRepo.save.mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.submit('ts-1');
      expect(result.status).toBe(TimesheetStatus.SUBMITTED);
    });

    it('should throw for non-DRAFT/CORRECTION_REQUESTED states', async () => {
      periodRepo.findOne.mockResolvedValue({
        ...mockPeriod,
        status: TimesheetStatus.APPROVED,
      });

      await expect(service.submit('ts-1')).rejects.toThrow(BadRequestException);
    });
  });

  // ── approve ──

  describe('approve', () => {
    it('should move SUBMITTED → APPROVED', async () => {
      periodRepo.findOne.mockResolvedValue({
        ...mockPeriod,
        status: TimesheetStatus.SUBMITTED,
      });
      periodRepo.save.mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.approve('ts-1', 'user-1');
      expect(result.status).toBe(TimesheetStatus.APPROVED);
      expect(result.approvedBy).toBe('user-1');
      expect(result.approvedAt).toBeDefined();
    });

    it('should throw for non-SUBMITTED states', async () => {
      periodRepo.findOne.mockResolvedValue({
        ...mockPeriod,
        status: TimesheetStatus.DRAFT,
      });

      await expect(service.approve('ts-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ── reject ──

  describe('reject', () => {
    it('should move SUBMITTED → REJECTED with reason', async () => {
      periodRepo.findOne.mockResolvedValue({
        ...mockPeriod,
        status: TimesheetStatus.SUBMITTED,
      });
      periodRepo.save.mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.reject('ts-1', 'Incorrect hours');
      expect(result.status).toBe(TimesheetStatus.REJECTED);
      expect(result.rejectionReason).toBe('Incorrect hours');
      expect(result.rejectedAt).toBeDefined();
    });

    it('should throw for non-SUBMITTED states', async () => {
      periodRepo.findOne.mockResolvedValue({
        ...mockPeriod,
        status: TimesheetStatus.DRAFT,
      });

      await expect(service.reject('ts-1', 'reason')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ── requestCorrection ──

  describe('requestCorrection', () => {
    it('should move SUBMITTED → CORRECTION_REQUESTED', async () => {
      periodRepo.findOne.mockResolvedValue({
        ...mockPeriod,
        status: TimesheetStatus.SUBMITTED,
      });
      periodRepo.save.mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.requestCorrection(
        'ts-1',
        'Please fix hours',
      );
      expect(result.status).toBe(TimesheetStatus.CORRECTION_REQUESTED);
      expect(result.rejectionReason).toBe('Please fix hours');
    });

    it('should throw for non-SUBMITTED states', async () => {
      periodRepo.findOne.mockResolvedValue({
        ...mockPeriod,
        status: TimesheetStatus.DRAFT,
      });

      await expect(service.requestCorrection('ts-1', 'reason')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ── lock ──

  describe('lock', () => {
    it('should move APPROVED → LOCKED', async () => {
      periodRepo.findOne.mockResolvedValue({
        ...mockPeriod,
        status: TimesheetStatus.APPROVED,
      });
      periodRepo.save.mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.lock('ts-1');
      expect(result.status).toBe(TimesheetStatus.LOCKED);
      expect(result.isLocked).toBe(true);
    });

    it('should throw for non-APPROVED states', async () => {
      periodRepo.findOne.mockResolvedValue({
        ...mockPeriod,
        status: TimesheetStatus.SUBMITTED,
      });

      await expect(service.lock('ts-1')).rejects.toThrow(BadRequestException);
    });
  });

  // ── remove ──

  describe('remove', () => {
    it('should only delete DRAFT timesheets', async () => {
      periodRepo.findOne.mockResolvedValue({
        ...mockPeriod,
        status: TimesheetStatus.DRAFT,
      });

      await service.remove('ts-1');
      expect(entryRepo.deleteByPeriodId).toHaveBeenCalledWith('ts-1');
      expect(periodRepo.remove).toHaveBeenCalled();
    });

    it('should throw for non-DRAFT timesheets', async () => {
      periodRepo.findOne.mockResolvedValue({
        ...mockPeriod,
        status: TimesheetStatus.SUBMITTED,
      });

      await expect(service.remove('ts-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for non-existent period', async () => {
      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ── addEntries ──

  describe('addEntries', () => {
    it('should add entries to DRAFT timesheet', async () => {
      const period = { ...mockPeriod, status: TimesheetStatus.DRAFT };
      periodRepo.findOne.mockResolvedValueOnce(period).mockResolvedValueOnce({
        ...period,
        entries: [{ workedMinutes: 480, overtimeMinutes: 0 }],
      });
      periodRepo.save.mockImplementation((entity) => Promise.resolve(entity));

      await service.addEntries('ts-1', [
        { date: '2025-06-01', workedMinutes: 480 } as any,
      ]);

      expect(entryRepo.create).toHaveBeenCalled();
      expect(entryRepo.saveAll).toHaveBeenCalled();
    });

    it('should add entries to CORRECTION_REQUESTED timesheet', async () => {
      const period = {
        ...mockPeriod,
        status: TimesheetStatus.CORRECTION_REQUESTED,
      };
      periodRepo.findOne
        .mockResolvedValueOnce(period)
        .mockResolvedValueOnce({ ...period, entries: [] });
      periodRepo.save.mockImplementation((entity) => Promise.resolve(entity));

      await service.addEntries('ts-1', [
        { date: '2025-06-01', workedMinutes: 480 } as any,
      ]);

      expect(entryRepo.saveAll).toHaveBeenCalled();
    });

    it('should throw for SUBMITTED timesheets', async () => {
      periodRepo.findOne.mockResolvedValue({
        ...mockPeriod,
        status: TimesheetStatus.SUBMITTED,
      });

      await expect(
        service.addEntries('ts-1', [
          { date: '2025-06-01', workedMinutes: 480 } as any,
        ]),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw for APPROVED timesheets', async () => {
      periodRepo.findOne.mockResolvedValue({
        ...mockPeriod,
        status: TimesheetStatus.APPROVED,
      });

      await expect(
        service.addEntries('ts-1', [
          { date: '2025-06-01', workedMinutes: 480 } as any,
        ]),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
