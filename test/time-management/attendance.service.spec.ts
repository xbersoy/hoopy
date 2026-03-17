import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AttendanceService } from '@/time-management/attendance/services/attendance.service';
import { AttendanceRecord } from '@/time-management/attendance/entities/attendance-record.entity';
import { AttendanceStatus, CheckSource } from '@/time-management/attendance/enums/attendance.enums';
import { Employee } from '@/employee/entities/employee.entity';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let repo: jest.Mocked<any>;
  let employeeRepo: jest.Mocked<any>;

  const now = new Date('2025-06-01T09:00:00Z');
  const later = new Date('2025-06-01T17:00:00Z');

  const mockRecord: AttendanceRecord = {
    id: 'att-1',
    companyId: 'comp-1',
    company: null as any,
    employeeId: 'emp-1',
    employee: null as any,
    date: new Date('2025-06-01'),
    status: AttendanceStatus.PRESENT,
    checkIn: now,
    checkOut: null,
    checkInSource: CheckSource.WEB,
    checkOutSource: null,
    workedMinutes: null,
    breakMinutes: null,
    overtimeMinutes: null,
    lateMinutes: null,
    earlyDepartureMinutes: null,
    isOvernight: false,
    timezone: null,
    notes: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    repo = {
      create: jest.fn().mockImplementation((data) => ({ id: undefined, ...data })),
      save: jest.fn().mockImplementation((entity) =>
        Promise.resolve({ ...entity, id: entity.id || 'att-new' }),
      ),
      findOne: jest.fn().mockResolvedValue(null),
      findByEmployee: jest.fn().mockResolvedValue([]),
      findPaginated: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      remove: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    employeeRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'emp-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: 'AttendanceRecordRepository', useValue: repo },
        { provide: getRepositoryToken(Employee), useValue: employeeRepo },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── checkIn ──

  describe('checkIn', () => {
    it('should create a new record when none exists', async () => {
      repo.findByEmployee.mockResolvedValue([]);

      const result = await service.checkIn('comp-1', 'user-1', { source: CheckSource.WEB });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: 'comp-1',
          employeeId: 'emp-1',
          status: AttendanceStatus.PRESENT,
          checkInSource: CheckSource.WEB,
        }),
      );
      expect(repo.save).toHaveBeenCalled();
      expect(result.status).toBe(AttendanceStatus.PRESENT);
    });

    it('should throw BadRequestException if already checked in', async () => {
      repo.findByEmployee.mockResolvedValue([{ ...mockRecord, checkIn: now }]);

      await expect(
        service.checkIn('comp-1', 'user-1', {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should default source to WEB', async () => {
      repo.findByEmployee.mockResolvedValue([]);

      await service.checkIn('comp-1', 'user-1', {});

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ checkInSource: CheckSource.WEB }),
      );
    });

    it('should throw BadRequestException if no employee linked', async () => {
      employeeRepo.findOne.mockResolvedValue(null);

      await expect(
        service.checkIn('comp-1', 'user-no-emp', {}),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── checkOut ──

  describe('checkOut', () => {
    it('should update record with check-out time and calculate workedMinutes', async () => {
      const record = { ...mockRecord, checkIn: now, checkOut: null };
      repo.findByEmployee.mockResolvedValue([record]);
      repo.save.mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.checkOut('comp-1', 'user-1', { source: CheckSource.MOBILE });

      expect(repo.save).toHaveBeenCalled();
      expect(result.checkOut).toBeDefined();
      expect(result.checkOutSource).toBe(CheckSource.MOBILE);
      expect(result.workedMinutes).toBeDefined();
    });

    it('should throw BadRequestException if no check-in found', async () => {
      repo.findByEmployee.mockResolvedValue([]);

      await expect(
        service.checkOut('comp-1', 'user-1', {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if already checked out', async () => {
      repo.findByEmployee.mockResolvedValue([
        { ...mockRecord, checkIn: now, checkOut: later },
      ]);

      await expect(
        service.checkOut('comp-1', 'user-1', {}),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── findOne ──

  describe('findOne', () => {
    it('should return a record by id', async () => {
      repo.findOne.mockResolvedValue(mockRecord);
      const result = await service.findOne('att-1');
      expect(result).toEqual(mockRecord);
    });

    it('should throw NotFoundException when not found', async () => {
      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ── createManual ──

  describe('createManual', () => {
    it('should create a record with provided data', async () => {
      await service.createManual('comp-1', {
        employeeId: 'emp-1',
        date: '2025-06-01',
        status: AttendanceStatus.PRESENT,
      } as any);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: 'comp-1',
          employeeId: 'emp-1',
          checkInSource: CheckSource.MANUAL,
          checkOutSource: CheckSource.MANUAL,
        }),
      );
      expect(repo.save).toHaveBeenCalled();
    });

    it('should calculate workedMinutes if both times provided', async () => {
      const checkIn = '2025-06-01T09:00:00Z';
      const checkOut = '2025-06-01T17:00:00Z';
      repo.create.mockImplementation((data) => ({ ...data }));
      repo.save.mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.createManual('comp-1', {
        employeeId: 'emp-1',
        date: '2025-06-01',
        checkIn,
        checkOut,
      } as any);

      expect(result.workedMinutes).toBe(480);
    });
  });

  // ── update ──

  describe('update', () => {
    it('should update fields', async () => {
      repo.findOne.mockResolvedValue({ ...mockRecord });
      repo.save.mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.update('att-1', {
        status: AttendanceStatus.REMOTE,
        notes: 'Working from home',
      } as any);

      expect(result.status).toBe(AttendanceStatus.REMOTE);
      expect(result.notes).toBe('Working from home');
    });

    it('should recalculate workedMinutes when times change', async () => {
      repo.findOne.mockResolvedValue({ ...mockRecord, checkIn: now });
      repo.save.mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.update('att-1', {
        checkOut: '2025-06-01T17:00:00Z',
      } as any);

      expect(result.workedMinutes).toBe(480);
    });
  });

  // ── remove ──

  describe('remove', () => {
    it('should remove a record', async () => {
      repo.findOne.mockResolvedValue({ ...mockRecord });
      const result = await service.remove('att-1');
      expect(repo.remove).toHaveBeenCalled();
      expect(result.id).toBe('att-1');
    });

    it('should throw NotFoundException for non-existent record', async () => {
      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
