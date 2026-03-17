import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { LeaveTypeService } from '@/leave/services/leave-type.service';
import { LeaveType } from '@/leave/entities/leave-type.entity';
import { LeaveUnitType } from '@/leave/enums/leave.enums';

describe('LeaveTypeService', () => {
  let service: LeaveTypeService;
  let repo: jest.Mocked<any>;

  const mockLeaveType: LeaveType = {
    id: 'lt-1',
    companyId: 'comp-1',
    company: null as any,
    systemKey: null,
    code: 'annual',
    name: 'Annual Leave',
    description: 'Paid annual leave',
    unitType: LeaveUnitType.DAY,
    isPaid: true,
    requiresBalance: true,
    requiresAttachment: false,
    attachmentThresholdDays: null,
    isSystem: false,
    isActive: true,
    sortOrder: 1,
    color: '#3B82F6',
    icon: 'calendar',
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    repo = {
      create: jest.fn().mockImplementation((data) => ({ id: undefined, ...data })),
      save: jest.fn().mockImplementation((entity) =>
        Promise.resolve({ ...entity, id: entity.id || 'lt-new' }),
      ),
      findByCompany: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      findByCode: jest.fn().mockResolvedValue(null),
      remove: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaveTypeService,
        { provide: 'LeaveTypeRepository', useValue: repo },
      ],
    }).compile();

    service = module.get<LeaveTypeService>(LeaveTypeService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ──

  describe('create', () => {
    it('should create a leave type', async () => {
      repo.save.mockResolvedValue({ ...mockLeaveType, id: 'lt-new' });

      const result = await service.create('comp-1', {
        code: 'annual',
        name: 'Annual Leave',
      });

      expect(repo.findByCode).toHaveBeenCalledWith('comp-1', 'annual');
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ companyId: 'comp-1', code: 'annual', name: 'Annual Leave' }),
      );
      expect(repo.save).toHaveBeenCalled();
      expect(result.id).toBe('lt-new');
    });

    it('should throw ConflictException if code already exists', async () => {
      repo.findByCode.mockResolvedValue(mockLeaveType);

      await expect(
        service.create('comp-1', { code: 'annual', name: 'Annual Leave' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should pass optional fields through', async () => {
      repo.save.mockResolvedValue({ ...mockLeaveType });

      await service.create('comp-1', {
        code: 'sick',
        name: 'Sick Leave',
        unitType: LeaveUnitType.HOUR,
        isPaid: true,
        requiresAttachment: true,
        attachmentThresholdDays: 2,
        color: '#EF4444',
        icon: 'heart',
        sortOrder: 2,
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          unitType: LeaveUnitType.HOUR,
          requiresAttachment: true,
          attachmentThresholdDays: 2,
          color: '#EF4444',
        }),
      );
    });
  });

  // ── findAll ──

  describe('findAll', () => {
    it('should return leave types for company', async () => {
      repo.findByCompany.mockResolvedValue([mockLeaveType]);
      const result = await service.findAll('comp-1');
      expect(result).toHaveLength(1);
      expect(repo.findByCompany).toHaveBeenCalledWith('comp-1');
    });

    it('should return empty array when no types exist', async () => {
      const result = await service.findAll('comp-1');
      expect(result).toEqual([]);
    });
  });

  // ── findOne ──

  describe('findOne', () => {
    it('should return a leave type by id', async () => {
      repo.findOne.mockResolvedValue(mockLeaveType);
      const result = await service.findOne('lt-1');
      expect(result).toEqual(mockLeaveType);
    });

    it('should throw NotFoundException when not found', async () => {
      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ── update ──

  describe('update', () => {
    it('should update leave type fields', async () => {
      repo.findOne.mockResolvedValue({ ...mockLeaveType });
      repo.save.mockResolvedValue({ ...mockLeaveType, name: 'Updated Leave' });

      const result = await service.update('lt-1', { name: 'Updated Leave' });
      expect(result.name).toBe('Updated Leave');
    });

    it('should block structural changes on system types', async () => {
      repo.findOne.mockResolvedValue({ ...mockLeaveType, isSystem: true });

      await expect(
        service.update('lt-1', { isPaid: false }),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow name/description changes on system types', async () => {
      const systemType = { ...mockLeaveType, isSystem: true };
      repo.findOne.mockResolvedValue(systemType);
      repo.save.mockResolvedValue({ ...systemType, name: 'Renamed' });

      const result = await service.update('lt-1', { name: 'Renamed' });
      expect(result.name).toBe('Renamed');
    });
  });

  // ── remove ──

  describe('remove', () => {
    it('should remove a leave type', async () => {
      repo.findOne.mockResolvedValue({ ...mockLeaveType });
      const result = await service.remove('lt-1');
      expect(repo.remove).toHaveBeenCalled();
      expect(result.id).toBe('lt-1');
    });

    it('should throw ConflictException for system types', async () => {
      repo.findOne.mockResolvedValue({ ...mockLeaveType, isSystem: true });
      await expect(service.remove('lt-1')).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException for non-existent type', async () => {
      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
