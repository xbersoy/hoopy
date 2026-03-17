import { Test, TestingModule } from '@nestjs/testing';
import { LeaveRequestController } from '@/leave/controllers/leave-request.controller';
import { LeaveRequestService } from '@/leave/services/leave-request.service';
import { PermissionsService } from '@/permissions/services/permissions.service';
import { LeaveRequestStatus, SessionType } from '@/leave/enums/leave.enums';

describe('LeaveRequestController', () => {
  let controller: LeaveRequestController;
  let service: jest.Mocked<any>;

  const mockReq = { user: { id: 'user-1', companyId: 'comp-1' } };

  const mockRequest = {
    id: 'req-1',
    companyId: 'comp-1',
    employeeId: 'emp-1',
    leaveTypeId: 'lt-1',
    status: LeaveRequestStatus.DRAFT,
    startDate: new Date('2026-04-01'),
    endDate: new Date('2026-04-03'),
    durationDays: 3,
  };

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue(mockRequest),
      findPaginated: jest.fn().mockResolvedValue({ data: [mockRequest], total: 1, page: 1, limit: 10 }),
      findOne: jest.fn().mockResolvedValue(mockRequest),
      submit: jest.fn().mockResolvedValue({ ...mockRequest, status: LeaveRequestStatus.SUBMITTED }),
      approve: jest.fn().mockResolvedValue({ ...mockRequest, status: LeaveRequestStatus.APPROVED }),
      reject: jest.fn().mockResolvedValue({ ...mockRequest, status: LeaveRequestStatus.REJECTED }),
      cancel: jest.fn().mockResolvedValue({ ...mockRequest, status: LeaveRequestStatus.CANCELLED }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeaveRequestController],
      providers: [
        { provide: LeaveRequestService, useValue: service },
        { provide: PermissionsService, useValue: { userCan: jest.fn().mockResolvedValue(true) } },
      ],
    }).compile();

    controller = module.get<LeaveRequestController>(LeaveRequestController);
  });

  describe('create', () => {
    it('should pass companyId and userId from JWT', async () => {
      await controller.create(mockReq, {
        employeeId: 'emp-1',
        leaveTypeId: 'lt-1',
        startDate: '2026-04-01',
        endDate: '2026-04-03',
      });

      expect(service.create).toHaveBeenCalledWith('comp-1', 'user-1', {
        employeeId: 'emp-1',
        leaveTypeId: 'lt-1',
        startDate: '2026-04-01',
        endDate: '2026-04-03',
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const result = await controller.findAll(mockReq, { page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(service.findPaginated).toHaveBeenCalledWith('comp-1', { page: 1, limit: 10 });
    });

    it('should pass filter params through', async () => {
      await controller.findAll(mockReq, {
        employeeId: 'emp-1',
        status: LeaveRequestStatus.SUBMITTED,
      });

      expect(service.findPaginated).toHaveBeenCalledWith('comp-1', {
        employeeId: 'emp-1',
        status: LeaveRequestStatus.SUBMITTED,
      });
    });
  });

  describe('findOne', () => {
    it('should return a request by ID', async () => {
      const result = await controller.findOne('req-1');
      expect(result.id).toBe('req-1');
    });
  });

  describe('submit', () => {
    it('should submit and return updated request', async () => {
      const result = await controller.submit('req-1', mockReq);
      expect(result.status).toBe(LeaveRequestStatus.SUBMITTED);
      expect(service.submit).toHaveBeenCalledWith('req-1', 'user-1');
    });
  });

  describe('approve', () => {
    it('should approve and return updated request', async () => {
      const result = await controller.approve('req-1', mockReq);
      expect(result.status).toBe(LeaveRequestStatus.APPROVED);
      expect(service.approve).toHaveBeenCalledWith('req-1', 'user-1');
    });
  });

  describe('reject', () => {
    it('should reject and return updated request', async () => {
      const result = await controller.reject('req-1', mockReq);
      expect(result.status).toBe(LeaveRequestStatus.REJECTED);
      expect(service.reject).toHaveBeenCalledWith('req-1', 'user-1');
    });
  });

  describe('cancel', () => {
    it('should cancel and return updated request', async () => {
      const result = await controller.cancel('req-1', mockReq);
      expect(result.status).toBe(LeaveRequestStatus.CANCELLED);
      expect(service.cancel).toHaveBeenCalledWith('req-1', 'user-1');
    });
  });
});
