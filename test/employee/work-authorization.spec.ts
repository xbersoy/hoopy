import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeService } from '@/employee/employee.service';
import { Employee } from '@/employee/entities/employee.entity';
import { WorkAuthorizationType } from '@/employee/enums/work-authorization-type.enum';
import { WorkAuthorizationStatus } from '@/employee/enums/work-authorization-status.enum';

describe('EmployeeService - Work Authorization', () => {
  let service: EmployeeService;
  let employeeRepo: jest.Mocked<any>;
  let workAuthorizationRepo: jest.Mocked<any>;
  let emptyRepo: jest.Mocked<any>;

  const mockEmployee: Employee = {
    id: 'emp-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    position: 'Engineer',
    department: 'Engineering',
    hireDate: new Date('2020-01-15'),
    educations: [],
    emergencyContacts: [],
    dependents: [],
    workExperiences: [],
    jobInformations: [],
    licensesCertifications: [],
    nationalIds: [],
    workAuthorizations: [],
    employeeSkills: [],
    employeeCompetencies: [],
    user: undefined,
    company: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    employeeRepo = {
      create: jest
        .fn()
        .mockImplementation((data) => ({ id: undefined, ...data })),
      save: jest
        .fn()
        .mockImplementation((entity) =>
          Promise.resolve({ ...entity, id: entity.id || 'emp-new' }),
        ),
      findAllWithRelations: jest.fn().mockResolvedValue([]),
      findOneWithRelations: jest.fn().mockResolvedValue(null),
      remove: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    workAuthorizationRepo = {
      create: jest.fn().mockImplementation((data) => data),
      saveAll: jest
        .fn()
        .mockImplementation((entities) => Promise.resolve(entities)),
      deleteByEmployeeId: jest.fn().mockResolvedValue(undefined),
    };

    emptyRepo = {
      create: jest.fn().mockImplementation((data) => data),
      saveAll: jest
        .fn()
        .mockImplementation((entities) => Promise.resolve(entities)),
      deleteByEmployeeId: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeService,
        { provide: 'EmployeeRepository', useValue: employeeRepo },
        { provide: 'EmployeeEducationRepository', useValue: { ...emptyRepo } },
        {
          provide: 'EmployeeEmergencyContactRepository',
          useValue: { ...emptyRepo },
        },
        { provide: 'EmployeeDependentRepository', useValue: { ...emptyRepo } },
        {
          provide: 'EmployeeWorkExperienceRepository',
          useValue: { ...emptyRepo },
        },
        {
          provide: 'EmployeeJobInformationRepository',
          useValue: { ...emptyRepo },
        },
        {
          provide: 'EmployeeLicenseCertificationRepository',
          useValue: { ...emptyRepo },
        },
        { provide: 'EmployeeNationalIdRepository', useValue: { ...emptyRepo } },
        {
          provide: 'EmployeeWorkAuthorizationRepository',
          useValue: workAuthorizationRepo,
        },
      ],
    }).compile();

    service = module.get<EmployeeService>(EmployeeService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create with work authorizations', () => {
    it('should create an employee with work authorizations', async () => {
      const dto = {
        firstName: 'John',
        lastName: 'Doe',
        workAuthorizations: [
          {
            authorizationType: WorkAuthorizationType.WORK_VISA,
            status: WorkAuthorizationStatus.ACTIVE,
            documentNumber: 'EAC2390000001',
            country: 'United States',
            issueDate: '2023-10-01',
            expirationDate: '2026-09-30',
            issuingAuthority: 'USCIS',
            notes: 'H-1B Visa',
          },
        ],
      };

      employeeRepo.save.mockResolvedValueOnce({
        ...mockEmployee,
        id: 'emp-new',
      });
      employeeRepo.findOneWithRelations.mockResolvedValue({
        ...mockEmployee,
        id: 'emp-new',
        workAuthorizations: [
          {
            id: 'wa-1',
            authorizationType: WorkAuthorizationType.WORK_VISA,
            status: WorkAuthorizationStatus.ACTIVE,
            documentNumber: 'EAC2390000001',
          },
        ],
      });

      const result = await service.create(dto);

      expect(workAuthorizationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          authorizationType: WorkAuthorizationType.WORK_VISA,
          status: WorkAuthorizationStatus.ACTIVE,
          documentNumber: 'EAC2390000001',
          country: 'United States',
          issueDate: new Date('2023-10-01'),
          expirationDate: new Date('2026-09-30'),
          issuingAuthority: 'USCIS',
          notes: 'H-1B Visa',
          employee: expect.objectContaining({ id: 'emp-new' }),
          employee_id: 'emp-new',
        }),
      );
      expect(workAuthorizationRepo.saveAll).toHaveBeenCalledTimes(1);
      expect(result.workAuthorizations).toHaveLength(1);
    });

    it('should create an employee without work authorizations', async () => {
      const dto = { firstName: 'Jane', lastName: 'Smith' };

      employeeRepo.findOneWithRelations.mockResolvedValue({
        ...mockEmployee,
        id: 'emp-new',
        firstName: 'Jane',
        lastName: 'Smith',
      });

      const result = await service.create(dto);

      expect(workAuthorizationRepo.saveAll).not.toHaveBeenCalled();
      expect(result.firstName).toBe('Jane');
    });
  });

  describe('update with work authorizations', () => {
    it('should replace work authorizations when provided in update payload', async () => {
      employeeRepo.findOneWithRelations
        .mockResolvedValueOnce({ ...mockEmployee })
        .mockResolvedValueOnce({
          ...mockEmployee,
          workAuthorizations: [
            {
              id: 'wa-new',
              authorizationType: WorkAuthorizationType.PERMANENT_RESIDENT,
              status: WorkAuthorizationStatus.ACTIVE,
            },
          ],
        });

      await service.update('emp-1', {
        workAuthorizations: [
          {
            authorizationType: WorkAuthorizationType.PERMANENT_RESIDENT,
            status: WorkAuthorizationStatus.ACTIVE,
            documentNumber: 'GRN1234567890',
            country: 'United States',
          },
        ],
      });

      expect(workAuthorizationRepo.deleteByEmployeeId).toHaveBeenCalledWith(
        'emp-1',
      );
      expect(workAuthorizationRepo.saveAll).toHaveBeenCalledWith([
        expect.objectContaining({
          authorizationType: WorkAuthorizationType.PERMANENT_RESIDENT,
          status: WorkAuthorizationStatus.ACTIVE,
          documentNumber: 'GRN1234567890',
          employee_id: 'emp-1',
        }),
      ]);
    });

    it('should NOT touch work authorizations when not in update payload', async () => {
      employeeRepo.findOneWithRelations
        .mockResolvedValueOnce({ ...mockEmployee })
        .mockResolvedValueOnce({ ...mockEmployee, position: 'Lead' });

      await service.update('emp-1', { position: 'Lead' });

      expect(workAuthorizationRepo.deleteByEmployeeId).not.toHaveBeenCalled();
      expect(workAuthorizationRepo.saveAll).not.toHaveBeenCalled();
    });

    it('should convert work authorization dates to Date objects', async () => {
      employeeRepo.findOneWithRelations
        .mockResolvedValueOnce({ ...mockEmployee })
        .mockResolvedValueOnce(mockEmployee);

      await service.update('emp-1', {
        workAuthorizations: [
          {
            authorizationType: WorkAuthorizationType.WORK_VISA,
            issueDate: '2023-10-01',
            expirationDate: '2026-09-30',
          },
        ],
      });

      expect(workAuthorizationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          issueDate: new Date('2023-10-01'),
          expirationDate: new Date('2026-09-30'),
        }),
      );
    });
  });

  describe('remove with work authorizations', () => {
    it('should delete work authorizations when removing employee', async () => {
      employeeRepo.findOneWithRelations.mockResolvedValue({ ...mockEmployee });

      await service.remove('emp-1');

      expect(workAuthorizationRepo.deleteByEmployeeId).toHaveBeenCalledWith(
        'emp-1',
      );
    });
  });
});
