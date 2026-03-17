import { Test, TestingModule } from '@nestjs/testing';
import { LeaveTypeController } from '@/leave/controllers/leave-type.controller';
import { LeaveTypeService } from '@/leave/services/leave-type.service';
import { PermissionsService } from '@/permissions/services/permissions.service';
import { LeaveUnitType } from '@/leave/enums/leave.enums';

describe('LeaveTypeController', () => {
  let controller: LeaveTypeController;
  let service: jest.Mocked<any>;

  const mockReq = { user: { id: 'user-1', companyId: 'comp-1' } };

  const mockLeaveType = {
    id: 'lt-1',
    companyId: 'comp-1',
    code: 'annual',
    name: 'Annual Leave',
    unitType: LeaveUnitType.DAY,
    isActive: true,
  };

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue(mockLeaveType),
      findAll: jest.fn().mockResolvedValue([mockLeaveType]),
      findOne: jest.fn().mockResolvedValue(mockLeaveType),
      update: jest.fn().mockResolvedValue({ ...mockLeaveType, name: 'Updated' }),
      remove: jest.fn().mockResolvedValue(mockLeaveType),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeaveTypeController],
      providers: [
        { provide: LeaveTypeService, useValue: service },
        { provide: PermissionsService, useValue: { userCan: jest.fn().mockResolvedValue(true) } },
      ],
    }).compile();

    controller = module.get<LeaveTypeController>(LeaveTypeController);
  });

  describe('create', () => {
    it('should pass companyId from JWT and dto to service', async () => {
      await controller.create(mockReq, { code: 'annual', name: 'Annual Leave' });
      expect(service.create).toHaveBeenCalledWith('comp-1', { code: 'annual', name: 'Annual Leave' });
    });
  });

  describe('findAll', () => {
    it('should return leave types for the users company', async () => {
      const result = await controller.findAll(mockReq);
      expect(result).toHaveLength(1);
      expect(service.findAll).toHaveBeenCalledWith('comp-1');
    });
  });

  describe('findOne', () => {
    it('should return a leave type by ID', async () => {
      const result = await controller.findOne('lt-1');
      expect(result.id).toBe('lt-1');
    });
  });

  describe('update', () => {
    it('should update a leave type', async () => {
      const result = await controller.update('lt-1', { name: 'Updated' });
      expect(result.name).toBe('Updated');
      expect(service.update).toHaveBeenCalledWith('lt-1', { name: 'Updated' });
    });
  });

  describe('remove', () => {
    it('should remove a leave type', async () => {
      await controller.remove('lt-1');
      expect(service.remove).toHaveBeenCalledWith('lt-1');
    });
  });
});
