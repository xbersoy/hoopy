import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SkillType } from './entities/skill-type.entity';
import { Skill } from './entities/skill.entity';
import { Competency } from './entities/competency.entity';
import { CompetencyCategory } from './entities/competency-category.entity';
import { EmployeeSkill } from './entities/employee-skill.entity';
import { EmployeeCompetency } from './entities/employee-competency.entity';
import { CreateSkillTypeDto, UpdateSkillTypeDto } from './dto/skill-type.dto';
import { CreateSkillDto, UpdateSkillDto } from './dto/skill.dto';
import {
  CreateCompetencyDto,
  UpdateCompetencyDto,
} from './dto/competency.dto';
import {
  CreateCompetencyCategoryDto,
  UpdateCompetencyCategoryDto,
} from './dto/competency-category.dto';
import {
  CreateEmployeeSkillDto,
  UpdateEmployeeSkillDto,
} from './dto/employee-skill.dto';
import {
  CreateEmployeeCompetencyDto,
  UpdateEmployeeCompetencyDto,
} from './dto/employee-competency.dto';

@Injectable()
export class SkillsCompetenciesService {
  constructor(
    @InjectRepository(SkillType)
    private readonly skillTypeRepo: Repository<SkillType>,
    @InjectRepository(Skill)
    private readonly skillRepo: Repository<Skill>,
    @InjectRepository(Competency)
    private readonly competencyRepo: Repository<Competency>,
    @InjectRepository(CompetencyCategory)
    private readonly competencyCategoryRepo: Repository<CompetencyCategory>,
    @InjectRepository(EmployeeSkill)
    private readonly employeeSkillRepo: Repository<EmployeeSkill>,
    @InjectRepository(EmployeeCompetency)
    private readonly employeeCompetencyRepo: Repository<EmployeeCompetency>,
  ) {}

  // ────────────────────────────────────────────────────────────────
  // SKILL TYPES
  // ────────────────────────────────────────────────────────────────

  async findAllSkillTypes(
    companyId: string,
    activeOnly = false,
  ): Promise<SkillType[]> {
    const where: any = { companyId };
    if (activeOnly) {
      where.isActive = true;
    }
    return this.skillTypeRepo.find({
      where,
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findSkillTypeById(id: string, companyId: string): Promise<SkillType> {
    const skillType = await this.skillTypeRepo.findOne({
      where: { id, companyId },
    });
    if (!skillType) {
      throw new NotFoundException(`Skill type with ID "${id}" not found`);
    }
    return skillType;
  }

  async createSkillType(
    dto: CreateSkillTypeDto,
    companyId: string,
  ): Promise<SkillType> {
    // Check for duplicate name
    const existing = await this.skillTypeRepo
      .createQueryBuilder('st')
      .where('st.company_id = :companyId', { companyId })
      .andWhere('LOWER(st.name) = LOWER(:name)', { name: dto.name })
      .getOne();

    if (existing) {
      throw new ConflictException(
        `Skill type with name "${dto.name}" already exists`,
      );
    }

    const skillType = this.skillTypeRepo.create({
      ...dto,
      companyId,
    });
    return this.skillTypeRepo.save(skillType);
  }

  async updateSkillType(
    id: string,
    dto: UpdateSkillTypeDto,
    companyId: string,
  ): Promise<SkillType> {
    const skillType = await this.findSkillTypeById(id, companyId);

    // Check for duplicate name if name is being updated
    if (dto.name && dto.name !== skillType.name) {
      const existing = await this.skillTypeRepo
        .createQueryBuilder('st')
        .where('st.company_id = :companyId', { companyId })
        .andWhere('LOWER(st.name) = LOWER(:name)', { name: dto.name })
        .andWhere('st.id != :id', { id })
        .getOne();

      if (existing) {
        throw new ConflictException(
          `Skill type with name "${dto.name}" already exists`,
        );
      }
    }

    Object.assign(skillType, dto);
    return this.skillTypeRepo.save(skillType);
  }

  async archiveSkillType(id: string, companyId: string): Promise<SkillType> {
    const skillType = await this.findSkillTypeById(id, companyId);
    skillType.isActive = false;
    return this.skillTypeRepo.save(skillType);
  }

  // ────────────────────────────────────────────────────────────────
  // SKILLS
  // ────────────────────────────────────────────────────────────────

  async findAllSkills(
    companyId: string,
    options?: { activeOnly?: boolean; skillTypeId?: string },
  ): Promise<Skill[]> {
    const where: any = { companyId };
    if (options?.activeOnly) {
      where.isActive = true;
    }
    if (options?.skillTypeId) {
      where.skillTypeId = options.skillTypeId;
    }
    return this.skillRepo.find({
      where,
      relations: ['skillType'],
      order: { name: 'ASC' },
    });
  }

  async findSkillById(id: string, companyId: string): Promise<Skill> {
    const skill = await this.skillRepo.findOne({
      where: { id, companyId },
      relations: ['skillType'],
    });
    if (!skill) {
      throw new NotFoundException(`Skill with ID "${id}" not found`);
    }
    return skill;
  }

  async createSkill(dto: CreateSkillDto, companyId: string): Promise<Skill> {
    // Verify skill type exists and belongs to same company
    await this.findSkillTypeById(dto.skillTypeId, companyId);

    // Check for duplicate name
    const existing = await this.skillRepo
      .createQueryBuilder('s')
      .where('s.company_id = :companyId', { companyId })
      .andWhere('LOWER(s.name) = LOWER(:name)', { name: dto.name })
      .getOne();

    if (existing) {
      throw new ConflictException(
        `Skill with name "${dto.name}" already exists`,
      );
    }

    const skill = this.skillRepo.create({
      ...dto,
      companyId,
    });
    return this.skillRepo.save(skill);
  }

  async updateSkill(
    id: string,
    dto: UpdateSkillDto,
    companyId: string,
  ): Promise<Skill> {
    const skill = await this.findSkillById(id, companyId);

    // Verify skill type if being updated
    if (dto.skillTypeId && dto.skillTypeId !== skill.skillTypeId) {
      await this.findSkillTypeById(dto.skillTypeId, companyId);
    }

    // Check for duplicate name if name is being updated
    if (dto.name && dto.name !== skill.name) {
      const existing = await this.skillRepo
        .createQueryBuilder('s')
        .where('s.company_id = :companyId', { companyId })
        .andWhere('LOWER(s.name) = LOWER(:name)', { name: dto.name })
        .andWhere('s.id != :id', { id })
        .getOne();

      if (existing) {
        throw new ConflictException(
          `Skill with name "${dto.name}" already exists`,
        );
      }
    }

    Object.assign(skill, dto);
    return this.skillRepo.save(skill);
  }

  async archiveSkill(id: string, companyId: string): Promise<Skill> {
    const skill = await this.findSkillById(id, companyId);
    skill.isActive = false;
    return this.skillRepo.save(skill);
  }

  // ────────────────────────────────────────────────────────────────
  // COMPETENCY CATEGORIES
  // ────────────────────────────────────────────────────────────────

  async findAllCompetencyCategories(
    companyId: string,
    activeOnly = false,
  ): Promise<CompetencyCategory[]> {
    const where: any = { companyId };
    if (activeOnly) {
      where.isActive = true;
    }
    return this.competencyCategoryRepo.find({
      where,
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findCompetencyCategoryById(
    id: string,
    companyId: string,
  ): Promise<CompetencyCategory> {
    const category = await this.competencyCategoryRepo.findOne({
      where: { id, companyId },
    });
    if (!category) {
      throw new NotFoundException(
        `Competency category with ID "${id}" not found`,
      );
    }
    return category;
  }

  async createCompetencyCategory(
    dto: CreateCompetencyCategoryDto,
    companyId: string,
  ): Promise<CompetencyCategory> {
    // Check for duplicate name
    const existing = await this.competencyCategoryRepo
      .createQueryBuilder('cc')
      .where('cc.company_id = :companyId', { companyId })
      .andWhere('LOWER(cc.name) = LOWER(:name)', { name: dto.name })
      .getOne();

    if (existing) {
      throw new ConflictException(
        `Competency category with name "${dto.name}" already exists`,
      );
    }

    const category = this.competencyCategoryRepo.create({
      ...dto,
      companyId,
    });
    return this.competencyCategoryRepo.save(category);
  }

  async updateCompetencyCategory(
    id: string,
    dto: UpdateCompetencyCategoryDto,
    companyId: string,
  ): Promise<CompetencyCategory> {
    const category = await this.findCompetencyCategoryById(id, companyId);

    // Check for duplicate name if name is being updated
    if (dto.name && dto.name !== category.name) {
      const existing = await this.competencyCategoryRepo
        .createQueryBuilder('cc')
        .where('cc.company_id = :companyId', { companyId })
        .andWhere('LOWER(cc.name) = LOWER(:name)', { name: dto.name })
        .andWhere('cc.id != :id', { id })
        .getOne();

      if (existing) {
        throw new ConflictException(
          `Competency category with name "${dto.name}" already exists`,
        );
      }
    }

    Object.assign(category, dto);
    return this.competencyCategoryRepo.save(category);
  }

  async archiveCompetencyCategory(
    id: string,
    companyId: string,
  ): Promise<CompetencyCategory> {
    const category = await this.findCompetencyCategoryById(id, companyId);
    category.isActive = false;
    return this.competencyCategoryRepo.save(category);
  }

  // ────────────────────────────────────────────────────────────────
  // COMPETENCIES
  // ────────────────────────────────────────────────────────────────

  async findAllCompetencies(
    companyId: string,
    options?: { activeOnly?: boolean; competencyCategoryId?: string },
  ): Promise<Competency[]> {
    const where: any = { companyId };
    if (options?.activeOnly) {
      where.isActive = true;
    }
    if (options?.competencyCategoryId) {
      where.competencyCategoryId = options.competencyCategoryId;
    }
    return this.competencyRepo.find({
      where,
      relations: ['competencyCategory'],
      order: { name: 'ASC' },
    });
  }

  async findCompetencyById(id: string, companyId: string): Promise<Competency> {
    const competency = await this.competencyRepo.findOne({
      where: { id, companyId },
      relations: ['competencyCategory'],
    });
    if (!competency) {
      throw new NotFoundException(`Competency with ID "${id}" not found`);
    }
    return competency;
  }

  async createCompetency(
    dto: CreateCompetencyDto,
    companyId: string,
  ): Promise<Competency> {
    // Verify competency category exists if provided
    if (dto.competencyCategoryId) {
      await this.findCompetencyCategoryById(dto.competencyCategoryId, companyId);
    }

    // Check for duplicate name
    const existing = await this.competencyRepo
      .createQueryBuilder('c')
      .where('c.company_id = :companyId', { companyId })
      .andWhere('LOWER(c.name) = LOWER(:name)', { name: dto.name })
      .getOne();

    if (existing) {
      throw new ConflictException(
        `Competency with name "${dto.name}" already exists`,
      );
    }

    const competency = this.competencyRepo.create({
      ...dto,
      companyId,
    });
    return this.competencyRepo.save(competency);
  }

  async updateCompetency(
    id: string,
    dto: UpdateCompetencyDto,
    companyId: string,
  ): Promise<Competency> {
    const competency = await this.findCompetencyById(id, companyId);

    // Verify competency category if being updated
    if (
      dto.competencyCategoryId &&
      dto.competencyCategoryId !== competency.competencyCategoryId
    ) {
      await this.findCompetencyCategoryById(dto.competencyCategoryId, companyId);
    }

    // Check for duplicate name if name is being updated
    if (dto.name && dto.name !== competency.name) {
      const existing = await this.competencyRepo
        .createQueryBuilder('c')
        .where('c.company_id = :companyId', { companyId })
        .andWhere('LOWER(c.name) = LOWER(:name)', { name: dto.name })
        .andWhere('c.id != :id', { id })
        .getOne();

      if (existing) {
        throw new ConflictException(
          `Competency with name "${dto.name}" already exists`,
        );
      }
    }

    Object.assign(competency, dto);
    return this.competencyRepo.save(competency);
  }

  async archiveCompetency(id: string, companyId: string): Promise<Competency> {
    const competency = await this.findCompetencyById(id, companyId);
    competency.isActive = false;
    return this.competencyRepo.save(competency);
  }

  // ────────────────────────────────────────────────────────────────
  // EMPLOYEE SKILLS
  // ────────────────────────────────────────────────────────────────

  async findEmployeeSkills(
    employeeId: string,
    companyId: string,
  ): Promise<EmployeeSkill[]> {
    return this.employeeSkillRepo.find({
      where: { employeeId, companyId },
      relations: ['skill', 'skill.skillType', 'verifier'],
      order: { isPrimary: 'DESC', skill: { name: 'ASC' } },
    });
  }

  async findEmployeeSkillById(
    id: string,
    employeeId: string,
    companyId: string,
  ): Promise<EmployeeSkill> {
    const employeeSkill = await this.employeeSkillRepo.findOne({
      where: { id, employeeId, companyId },
      relations: ['skill', 'skill.skillType', 'verifier'],
    });
    if (!employeeSkill) {
      throw new NotFoundException(`Employee skill with ID "${id}" not found`);
    }
    return employeeSkill;
  }

  async createEmployeeSkill(
    employeeId: string,
    dto: CreateEmployeeSkillDto,
    companyId: string,
  ): Promise<EmployeeSkill> {
    // Verify skill exists and belongs to same company
    await this.findSkillById(dto.skillId, companyId);

    // Check for duplicate (same employee + same skill)
    const existing = await this.employeeSkillRepo.findOne({
      where: { employeeId, skillId: dto.skillId, companyId },
    });

    if (existing) {
      throw new ConflictException(`Employee already has this skill assigned`);
    }

    const employeeSkill = this.employeeSkillRepo.create({
      ...dto,
      employeeId,
      companyId,
      lastUsedAt: dto.lastUsedAt ? new Date(dto.lastUsedAt) : undefined,
    });
    const saved = await this.employeeSkillRepo.save(employeeSkill);
    return this.findEmployeeSkillById(saved.id, employeeId, companyId);
  }

  async updateEmployeeSkill(
    id: string,
    employeeId: string,
    dto: UpdateEmployeeSkillDto,
    companyId: string,
  ): Promise<EmployeeSkill> {
    const employeeSkill = await this.findEmployeeSkillById(
      id,
      employeeId,
      companyId,
    );

    Object.assign(employeeSkill, {
      ...dto,
      lastUsedAt: dto.lastUsedAt
        ? new Date(dto.lastUsedAt)
        : employeeSkill.lastUsedAt,
    });
    await this.employeeSkillRepo.save(employeeSkill);
    return this.findEmployeeSkillById(id, employeeId, companyId);
  }

  async deleteEmployeeSkill(
    id: string,
    employeeId: string,
    companyId: string,
  ): Promise<void> {
    const employeeSkill = await this.findEmployeeSkillById(
      id,
      employeeId,
      companyId,
    );
    await this.employeeSkillRepo.remove(employeeSkill);
  }

  // ────────────────────────────────────────────────────────────────
  // EMPLOYEE COMPETENCIES
  // ────────────────────────────────────────────────────────────────

  async findEmployeeCompetencies(
    employeeId: string,
    companyId: string,
  ): Promise<EmployeeCompetency[]> {
    return this.employeeCompetencyRepo.find({
      where: { employeeId, companyId },
      relations: ['competency', 'assessor'],
      order: { competency: { name: 'ASC' } },
    });
  }

  async findEmployeeCompetencyById(
    id: string,
    employeeId: string,
    companyId: string,
  ): Promise<EmployeeCompetency> {
    const employeeCompetency = await this.employeeCompetencyRepo.findOne({
      where: { id, employeeId, companyId },
      relations: ['competency', 'assessor'],
    });
    if (!employeeCompetency) {
      throw new NotFoundException(
        `Employee competency with ID "${id}" not found`,
      );
    }
    return employeeCompetency;
  }

  async createEmployeeCompetency(
    employeeId: string,
    dto: CreateEmployeeCompetencyDto,
    companyId: string,
  ): Promise<EmployeeCompetency> {
    // Verify competency exists and belongs to same company
    await this.findCompetencyById(dto.competencyId, companyId);

    // Check for duplicate (same employee + same competency)
    const existing = await this.employeeCompetencyRepo.findOne({
      where: { employeeId, competencyId: dto.competencyId, companyId },
    });

    if (existing) {
      throw new ConflictException(
        `Employee already has this competency assessed`,
      );
    }

    const employeeCompetency = this.employeeCompetencyRepo.create({
      ...dto,
      employeeId,
      companyId,
      assessedAt: new Date(dto.assessedAt),
    });
    const saved = await this.employeeCompetencyRepo.save(employeeCompetency);
    return this.findEmployeeCompetencyById(saved.id, employeeId, companyId);
  }

  async updateEmployeeCompetency(
    id: string,
    employeeId: string,
    dto: UpdateEmployeeCompetencyDto,
    companyId: string,
  ): Promise<EmployeeCompetency> {
    const employeeCompetency = await this.findEmployeeCompetencyById(
      id,
      employeeId,
      companyId,
    );

    Object.assign(employeeCompetency, {
      ...dto,
      assessedAt: dto.assessedAt
        ? new Date(dto.assessedAt)
        : employeeCompetency.assessedAt,
    });
    await this.employeeCompetencyRepo.save(employeeCompetency);
    return this.findEmployeeCompetencyById(id, employeeId, companyId);
  }

  async deleteEmployeeCompetency(
    id: string,
    employeeId: string,
    companyId: string,
  ): Promise<void> {
    const employeeCompetency = await this.findEmployeeCompetencyById(
      id,
      employeeId,
      companyId,
    );
    await this.employeeCompetencyRepo.remove(employeeCompetency);
  }
}
