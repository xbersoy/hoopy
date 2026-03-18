import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EmployeeService } from '@/employee/employee.service';
import { Employee } from '@/employee/entities/employee.entity';

describe('EmployeeService', () => {
  let service: EmployeeService;
  let employeeRepo: jest.Mocked<any>;
  let educationRepo: jest.Mocked<any>;
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

    educationRepo = {
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
        { provide: 'EmployeeEducationRepository', useValue: educationRepo },
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
          useValue: { ...emptyRepo },
        },
      ],
    }).compile();

    service = module.get<EmployeeService>(EmployeeService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ────────────────────────────────────────────────

  describe('create', () => {
    it('should create an employee without educations', async () => {
      const dto = { firstName: 'Jane', lastName: 'Smith' };

      // findOne is called at the end to return with relations
      employeeRepo.findOneWithRelations.mockResolvedValue({
        ...mockEmployee,
        id: 'emp-new',
        firstName: 'Jane',
        lastName: 'Smith',
      });

      const result = await service.create(dto);

      expect(employeeRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ firstName: 'Jane', lastName: 'Smith' }),
      );
      expect(employeeRepo.save).toHaveBeenCalled();
      expect(educationRepo.saveAll).not.toHaveBeenCalled();
      expect(result.firstName).toBe('Jane');
    });

    it('should create an employee with educations', async () => {
      const dto = {
        firstName: 'John',
        lastName: 'Doe',
        educations: [{ institution: 'MIT', degree: 'BSc', fieldOfStudy: 'CS' }],
      };

      employeeRepo.save.mockResolvedValueOnce({
        ...mockEmployee,
        id: 'emp-new',
      });
      employeeRepo.findOneWithRelations.mockResolvedValue({
        ...mockEmployee,
        id: 'emp-new',
        educations: [{ id: 'edu-1', institution: 'MIT', degree: 'BSc' }],
      });

      const result = await service.create(dto);

      expect(educationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          institution: 'MIT',
          degree: 'BSc',
          employee: expect.objectContaining({ id: 'emp-new' }),
          employee_id: 'emp-new',
        }),
      );
      expect(educationRepo.saveAll).toHaveBeenCalledTimes(1);
      expect(result.educations).toHaveLength(1);
    });

    it('should convert hireDate string to Date', async () => {
      const dto = {
        firstName: 'John',
        lastName: 'Doe',
        hireDate: '2023-06-15',
      };
      employeeRepo.findOneWithRelations.mockResolvedValue(mockEmployee);

      await service.create(dto);

      expect(employeeRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ hireDate: new Date('2023-06-15') }),
      );
    });

    it('should ignore hireDate when not provided', async () => {
      const dto = { firstName: 'John', lastName: 'Doe' };
      employeeRepo.findOneWithRelations.mockResolvedValue(mockEmployee);

      await service.create(dto);

      expect(employeeRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ hireDate: undefined }),
      );
    });
  });

  // ── findAll ───────────────────────────────────────────────

  describe('findAll', () => {
    it('should return all employees with their educations', async () => {
      employeeRepo.findAllWithRelations.mockResolvedValue([mockEmployee]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockEmployee);
      expect(employeeRepo.findAllWithRelations).toHaveBeenCalled();
    });

    it('should return empty array when no employees exist', async () => {
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  // ── findOne ───────────────────────────────────────────────

  describe('findOne', () => {
    it('should return an employee by id', async () => {
      employeeRepo.findOneWithRelations.mockResolvedValue(mockEmployee);

      const result = await service.findOne('emp-1');

      expect(result).toEqual(mockEmployee);
      expect(employeeRepo.findOneWithRelations).toHaveBeenCalledWith('emp-1');
    });

    it('should throw NotFoundException when employee does not exist', async () => {
      await expect(service.findOne('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── update ────────────────────────────────────────────────

  describe('update', () => {
    it('should update employee fields', async () => {
      employeeRepo.findOneWithRelations
        .mockResolvedValueOnce({ ...mockEmployee }) // findOne at start
        .mockResolvedValueOnce({
          // findOne at end
          ...mockEmployee,
          position: 'Senior Engineer',
        });

      const result = await service.update('emp-1', {
        position: 'Senior Engineer',
      });

      expect(employeeRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ position: 'Senior Engineer' }),
      );
      expect(result.position).toBe('Senior Engineer');
    });

    it('should replace educations when provided in update payload', async () => {
      employeeRepo.findOneWithRelations
        .mockResolvedValueOnce({ ...mockEmployee })
        .mockResolvedValueOnce({
          ...mockEmployee,
          educations: [
            { id: 'edu-new', institution: 'Stanford', degree: 'MSc' },
          ],
        });

      await service.update('emp-1', {
        educations: [{ institution: 'Stanford', degree: 'MSc' }],
      });

      expect(educationRepo.deleteByEmployeeId).toHaveBeenCalledWith('emp-1');
      expect(educationRepo.saveAll).toHaveBeenCalledWith([
        expect.objectContaining({
          institution: 'Stanford',
          degree: 'MSc',
          employee_id: 'emp-1',
        }),
      ]);
    });

    it('should NOT touch educations when not in update payload', async () => {
      employeeRepo.findOneWithRelations
        .mockResolvedValueOnce({ ...mockEmployee })
        .mockResolvedValueOnce({ ...mockEmployee, position: 'Lead' });

      await service.update('emp-1', { position: 'Lead' });

      expect(educationRepo.deleteByEmployeeId).not.toHaveBeenCalled();
      expect(educationRepo.saveAll).not.toHaveBeenCalled();
    });

    it('should convert education dates to Date objects', async () => {
      employeeRepo.findOneWithRelations
        .mockResolvedValueOnce({ ...mockEmployee })
        .mockResolvedValueOnce(mockEmployee);

      await service.update('emp-1', {
        educations: [
          {
            institution: 'MIT',
            degree: 'BSc',
            startDate: '2015-09-01',
            endDate: '2019-06-30',
          },
        ],
      });

      expect(educationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: new Date('2015-09-01'),
          endDate: new Date('2019-06-30'),
        }),
      );
    });

    it('should not save employee when employeeData is empty (only educations)', async () => {
      employeeRepo.findOneWithRelations
        .mockResolvedValueOnce({ ...mockEmployee })
        .mockResolvedValueOnce(mockEmployee);

      await service.update('emp-1', {
        educations: [{ institution: 'MIT', degree: 'BSc' }],
      });

      // employeeRepo.save should NOT be called (only educations changed)
      expect(employeeRepo.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent employee', async () => {
      await expect(service.update('bad', { position: 'x' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── remove ────────────────────────────────────────────────

  describe('remove', () => {
    it('should delete educations, remove employee, and preserve id in result', async () => {
      employeeRepo.findOneWithRelations.mockResolvedValue({ ...mockEmployee });

      const result = await service.remove('emp-1');

      expect(educationRepo.deleteByEmployeeId).toHaveBeenCalledWith('emp-1');
      expect(employeeRepo.remove).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'emp-1' }),
      );
      // Service spreads and re-adds id because TypeORM strips it on remove
      expect(result.id).toBe('emp-1');
    });

    it('should throw NotFoundException for non-existent employee', async () => {
      await expect(service.remove('bad')).rejects.toThrow(NotFoundException);
    });
  });
});
