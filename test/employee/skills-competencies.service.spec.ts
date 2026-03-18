import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SkillsCompetenciesService } from '@/employee/skills-competencies.service';
import { SkillType } from '@/employee/entities/skill-type.entity';
import { Skill } from '@/employee/entities/skill.entity';
import { Competency } from '@/employee/entities/competency.entity';
import { CompetencyCategory } from '@/employee/entities/competency-category.entity';
import { EmployeeSkill } from '@/employee/entities/employee-skill.entity';
import { EmployeeCompetency } from '@/employee/entities/employee-competency.entity';
import { ProficiencyLevel } from '@/employee/enums/proficiency-level.enum';
import { AssessmentSource } from '@/employee/enums/assessment-source.enum';

describe('SkillsCompetenciesService', () => {
  let service: SkillsCompetenciesService;
  let skillTypeRepo: jest.Mocked<Repository<SkillType>>;
  let skillRepo: jest.Mocked<Repository<Skill>>;
  let competencyRepo: jest.Mocked<Repository<Competency>>;
  let competencyCategoryRepo: jest.Mocked<Repository<CompetencyCategory>>;
  let employeeSkillRepo: jest.Mocked<Repository<EmployeeSkill>>;
  let employeeCompetencyRepo: jest.Mocked<Repository<EmployeeCompetency>>;

  const companyId = 'company-1';
  const employeeId = 'employee-1';

  const mockSkillType: SkillType = {
    id: 'st-1',
    companyId,
    code: 'TECH',
    name: 'Technical',
    description: 'Technical skills',
    isActive: true,
    sortOrder: 1,
    skills: [],
    company: null as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSkill: Skill = {
    id: 'skill-1',
    companyId,
    skillTypeId: 'st-1',
    code: 'TS',
    name: 'TypeScript',
    description: 'TypeScript programming',
    isActive: true,
    skillType: mockSkillType,
    employeeSkills: [],
    company: null as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCompetency: Competency = {
    id: 'comp-1',
    companyId,
    code: 'LEADERSHIP',
    name: 'Leadership',
    description: 'Leadership ability',
    category: 'Behavioral',
    competencyCategoryId: null as any,
    competencyCategory: null as any,
    isActive: true,
    employeeCompetencies: [],
    company: null as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockEmployeeSkill: EmployeeSkill = {
    id: 'es-1',
    companyId,
    employeeId,
    skillId: 'skill-1',
    proficiencyLevel: ProficiencyLevel.INTERMEDIATE,
    yearsOfExperience: 3,
    lastUsedAt: new Date(),
    isPrimary: false,
    isVerified: false,
    verifiedBy: null as any,
    notes: null as any,
    skill: mockSkill,
    employee: null as any,
    company: null as any,
    verifier: null as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockEmployeeCompetency: EmployeeCompetency = {
    id: 'ec-1',
    companyId,
    employeeId,
    competencyId: 'comp-1',
    rating: 4,
    assessmentSource: AssessmentSource.MANAGER,
    assessedAt: new Date(),
    assessorUserId: null as any,
    notes: null as any,
    competency: mockCompetency,
    employee: null as any,
    company: null as any,
    assessor: null as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };

    skillTypeRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest
        .fn()
        .mockImplementation((data) => ({ ...data, id: 'st-new' })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as any;

    skillRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest
        .fn()
        .mockImplementation((data) => ({ ...data, id: 'skill-new' })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as any;

    competencyRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest
        .fn()
        .mockImplementation((data) => ({ ...data, id: 'comp-new' })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as any;

    employeeSkillRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest
        .fn()
        .mockImplementation((data) => ({ ...data, id: 'es-new' })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      remove: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    } as any;

    employeeCompetencyRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest
        .fn()
        .mockImplementation((data) => ({ ...data, id: 'ec-new' })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      remove: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    } as any;

    competencyCategoryRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest
        .fn()
        .mockImplementation((data) => ({ ...data, id: 'cc-new' })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkillsCompetenciesService,
        { provide: getRepositoryToken(SkillType), useValue: skillTypeRepo },
        { provide: getRepositoryToken(Skill), useValue: skillRepo },
        { provide: getRepositoryToken(Competency), useValue: competencyRepo },
        { provide: getRepositoryToken(CompetencyCategory), useValue: competencyCategoryRepo },
        {
          provide: getRepositoryToken(EmployeeSkill),
          useValue: employeeSkillRepo,
        },
        {
          provide: getRepositoryToken(EmployeeCompetency),
          useValue: employeeCompetencyRepo,
        },
      ],
    }).compile();

    service = module.get<SkillsCompetenciesService>(SkillsCompetenciesService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── SKILL TYPES ─────────────────────────────────────────────────

  describe('Skill Types', () => {
    describe('findAllSkillTypes', () => {
      it('should return all skill types for a company', async () => {
        skillTypeRepo.find.mockResolvedValue([mockSkillType]);
        const result = await service.findAllSkillTypes(companyId);
        expect(result).toHaveLength(1);
        expect(skillTypeRepo.find).toHaveBeenCalledWith({
          where: { companyId },
          order: { sortOrder: 'ASC', name: 'ASC' },
        });
      });

      it('should filter active skill types when activeOnly is true', async () => {
        await service.findAllSkillTypes(companyId, true);
        expect(skillTypeRepo.find).toHaveBeenCalledWith({
          where: { companyId, isActive: true },
          order: { sortOrder: 'ASC', name: 'ASC' },
        });
      });
    });

    describe('findSkillTypeById', () => {
      it('should return a skill type by id', async () => {
        skillTypeRepo.findOne.mockResolvedValue(mockSkillType);
        const result = await service.findSkillTypeById('st-1', companyId);
        expect(result).toEqual(mockSkillType);
      });

      it('should throw NotFoundException when skill type not found', async () => {
        await expect(
          service.findSkillTypeById('bad-id', companyId),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('createSkillType', () => {
      it('should create a new skill type', async () => {
        const dto = { name: 'Technical', description: 'Tech skills' };
        await service.createSkillType(dto, companyId);
        expect(skillTypeRepo.create).toHaveBeenCalledWith({
          ...dto,
          companyId,
        });
        expect(skillTypeRepo.save).toHaveBeenCalled();
      });

      it('should throw ConflictException when name already exists', async () => {
        const mockQb = {
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue(mockSkillType),
        };
        skillTypeRepo.createQueryBuilder.mockReturnValue(mockQb as any);

        const dto = { name: 'Technical' };
        await expect(service.createSkillType(dto, companyId)).rejects.toThrow(
          ConflictException,
        );
      });
    });

    describe('archiveSkillType', () => {
      it('should archive a skill type by setting isActive to false', async () => {
        skillTypeRepo.findOne.mockResolvedValue({ ...mockSkillType });
        const result = await service.archiveSkillType('st-1', companyId);
        expect(result.isActive).toBe(false);
        expect(skillTypeRepo.save).toHaveBeenCalled();
      });
    });
  });

  // ── SKILLS ──────────────────────────────────────────────────────

  describe('Skills', () => {
    describe('findAllSkills', () => {
      it('should return all skills for a company', async () => {
        skillRepo.find.mockResolvedValue([mockSkill]);
        const result = await service.findAllSkills(companyId);
        expect(result).toHaveLength(1);
      });

      it('should filter by skillTypeId when provided', async () => {
        await service.findAllSkills(companyId, { skillTypeId: 'st-1' });
        expect(skillRepo.find).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { companyId, skillTypeId: 'st-1' },
          }),
        );
      });
    });

    describe('createSkill', () => {
      it('should create a new skill', async () => {
        // Mock findSkillTypeById
        skillTypeRepo.findOne.mockResolvedValue(mockSkillType);

        const dto = { name: 'TypeScript', skillTypeId: 'st-1' };
        await service.createSkill(dto, companyId);
        expect(skillRepo.create).toHaveBeenCalledWith({
          ...dto,
          companyId,
        });
        expect(skillRepo.save).toHaveBeenCalled();
      });

      it('should throw NotFoundException when skill type not found', async () => {
        const dto = { name: 'TypeScript', skillTypeId: 'bad-st' };
        await expect(service.createSkill(dto, companyId)).rejects.toThrow(
          NotFoundException,
        );
      });
    });
  });

  // ── COMPETENCIES ────────────────────────────────────────────────

  describe('Competencies', () => {
    describe('findAllCompetencies', () => {
      it('should return all competencies for a company', async () => {
        competencyRepo.find.mockResolvedValue([mockCompetency]);
        const result = await service.findAllCompetencies(companyId);
        expect(result).toHaveLength(1);
      });
    });

    describe('createCompetency', () => {
      it('should create a new competency', async () => {
        const dto = { name: 'Leadership', category: 'Behavioral' };
        await service.createCompetency(dto, companyId);
        expect(competencyRepo.create).toHaveBeenCalledWith({
          ...dto,
          companyId,
        });
        expect(competencyRepo.save).toHaveBeenCalled();
      });
    });
  });

  // ── EMPLOYEE SKILLS ─────────────────────────────────────────────

  describe('Employee Skills', () => {
    describe('findEmployeeSkills', () => {
      it('should return all skills for an employee', async () => {
        employeeSkillRepo.find.mockResolvedValue([mockEmployeeSkill]);
        const result = await service.findEmployeeSkills(employeeId, companyId);
        expect(result).toHaveLength(1);
      });
    });

    describe('createEmployeeSkill', () => {
      it('should create a new employee skill', async () => {
        // Mock skill lookup
        skillRepo.findOne.mockResolvedValue(mockSkill);
        // Mock duplicate check
        employeeSkillRepo.findOne.mockResolvedValueOnce(null);
        // Mock after-create lookup
        employeeSkillRepo.findOne.mockResolvedValueOnce(mockEmployeeSkill);

        const dto = {
          skillId: 'skill-1',
          proficiencyLevel: ProficiencyLevel.INTERMEDIATE,
        };
        await service.createEmployeeSkill(employeeId, dto, companyId);
        expect(employeeSkillRepo.create).toHaveBeenCalled();
        expect(employeeSkillRepo.save).toHaveBeenCalled();
      });

      it('should throw ConflictException when employee already has the skill', async () => {
        skillRepo.findOne.mockResolvedValue(mockSkill);
        employeeSkillRepo.findOne.mockResolvedValue(mockEmployeeSkill);

        const dto = {
          skillId: 'skill-1',
          proficiencyLevel: ProficiencyLevel.INTERMEDIATE,
        };
        await expect(
          service.createEmployeeSkill(employeeId, dto, companyId),
        ).rejects.toThrow(ConflictException);
      });
    });

    describe('deleteEmployeeSkill', () => {
      it('should delete an employee skill', async () => {
        employeeSkillRepo.findOne.mockResolvedValue(mockEmployeeSkill);
        await service.deleteEmployeeSkill('es-1', employeeId, companyId);
        expect(employeeSkillRepo.remove).toHaveBeenCalledWith(
          mockEmployeeSkill,
        );
      });

      it('should throw NotFoundException when employee skill not found', async () => {
        await expect(
          service.deleteEmployeeSkill('bad-id', employeeId, companyId),
        ).rejects.toThrow(NotFoundException);
      });
    });
  });

  // ── EMPLOYEE COMPETENCIES ───────────────────────────────────────

  describe('Employee Competencies', () => {
    describe('findEmployeeCompetencies', () => {
      it('should return all competencies for an employee', async () => {
        employeeCompetencyRepo.find.mockResolvedValue([mockEmployeeCompetency]);
        const result = await service.findEmployeeCompetencies(
          employeeId,
          companyId,
        );
        expect(result).toHaveLength(1);
      });
    });

    describe('createEmployeeCompetency', () => {
      it('should create a new employee competency', async () => {
        competencyRepo.findOne.mockResolvedValue(mockCompetency);
        employeeCompetencyRepo.findOne.mockResolvedValueOnce(null);
        employeeCompetencyRepo.findOne.mockResolvedValueOnce(
          mockEmployeeCompetency,
        );

        const dto = {
          competencyId: 'comp-1',
          rating: 4,
          assessmentSource: AssessmentSource.MANAGER,
          assessedAt: '2024-01-15',
        };
        await service.createEmployeeCompetency(employeeId, dto, companyId);
        expect(employeeCompetencyRepo.create).toHaveBeenCalled();
        expect(employeeCompetencyRepo.save).toHaveBeenCalled();
      });

      it('should throw ConflictException when employee already has the competency', async () => {
        competencyRepo.findOne.mockResolvedValue(mockCompetency);
        employeeCompetencyRepo.findOne.mockResolvedValue(
          mockEmployeeCompetency,
        );

        const dto = {
          competencyId: 'comp-1',
          rating: 4,
          assessmentSource: AssessmentSource.MANAGER,
          assessedAt: '2024-01-15',
        };
        await expect(
          service.createEmployeeCompetency(employeeId, dto, companyId),
        ).rejects.toThrow(ConflictException);
      });
    });

    describe('deleteEmployeeCompetency', () => {
      it('should delete an employee competency', async () => {
        employeeCompetencyRepo.findOne.mockResolvedValue(
          mockEmployeeCompetency,
        );
        await service.deleteEmployeeCompetency('ec-1', employeeId, companyId);
        expect(employeeCompetencyRepo.remove).toHaveBeenCalledWith(
          mockEmployeeCompetency,
        );
      });
    });
  });
});
