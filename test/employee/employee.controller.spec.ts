import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeController } from '@/employee/employee.controller';
import { EmployeeService } from '@/employee/employee.service';
import { Employee } from '@/employee/entities/employee.entity';
import { PermissionsService } from '@/permissions/services/permissions.service';

describe('EmployeeController', () => {
  let controller: EmployeeController;
  let employeeService: jest.Mocked<any>;

  const mockEmployee: Employee = {
    id: 'emp-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: null,
    position: 'Engineer',
    department: 'Engineering',
    hireDate: null,
    educations: [],
    emergencyContacts: [],
    dependents: [],
    workExperiences: [],
    jobInformations: [],
    licensesCertifications: [],
    nationalIds: [],
    user: undefined,
    company: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    employeeService = {
      create: jest.fn(),
      findPaginated: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeController],
      providers: [
        { provide: EmployeeService, useValue: employeeService },
        {
          provide: PermissionsService,
          useValue: { userCan: jest.fn().mockResolvedValue(true) },
        },
      ],
    }).compile();

    controller = module.get<EmployeeController>(EmployeeController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should call service.create and return the created employee', async () => {
      const dto = { firstName: 'John', lastName: 'Doe' };
      employeeService.create.mockResolvedValue(mockEmployee);

      const result = await controller.create(dto as any);

      expect(result).toEqual(mockEmployee);
      expect(employeeService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all employees', async () => {
      employeeService.findPaginated.mockResolvedValue({
        data: [mockEmployee],
        total: 1,
      });

      const result = await controller.findAll({});

      expect(result).toEqual({ data: [mockEmployee], total: 1 });
      expect(employeeService.findPaginated).toHaveBeenCalled();
    });

    it('should return empty array when no employees exist', async () => {
      employeeService.findPaginated.mockResolvedValue({ data: [], total: 0 });

      const result = await controller.findAll({});

      expect(result).toEqual({ data: [], total: 0 });
    });
  });

  describe('findOne', () => {
    it('should return employee by id', async () => {
      employeeService.findOne.mockResolvedValue(mockEmployee);

      const result = await controller.findOne('emp-1');

      expect(result).toEqual(mockEmployee);
      expect(employeeService.findOne).toHaveBeenCalledWith('emp-1');
    });
  });

  describe('update', () => {
    it('should call service.update with id and dto', async () => {
      const dto = { position: 'Senior Engineer' };
      employeeService.update.mockResolvedValue({ ...mockEmployee, ...dto });

      const result = await controller.update('emp-1', dto as any);

      expect(employeeService.update).toHaveBeenCalledWith('emp-1', dto);
      expect(result.position).toBe('Senior Engineer');
    });
  });

  describe('remove', () => {
    it('should call service.remove and return the removed employee', async () => {
      employeeService.remove.mockResolvedValue(mockEmployee);

      const result = await controller.remove('emp-1');

      expect(result).toEqual(mockEmployee);
      expect(employeeService.remove).toHaveBeenCalledWith('emp-1');
    });
  });
});
