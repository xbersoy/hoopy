import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ScheduleTemplate } from './entities/schedule-template.entity';
import { ScheduleTemplateI18n } from './entities/schedule-template-i18n.entity';
import { ShiftTemplate } from './entities/shift-template.entity';
import { ShiftTemplateI18n } from './entities/shift-template-i18n.entity';
import { EmployeeSchedule } from './entities/employee-schedule.entity';

// ─── Interfaces ─────────────────────────────────────────────

export interface IScheduleTemplateRepository {
  create(data: Partial<ScheduleTemplate>): ScheduleTemplate;
  save(entity: ScheduleTemplate): Promise<ScheduleTemplate>;
  findByCompany(companyId: string): Promise<ScheduleTemplate[]>;
  findByCode(companyId: string, code: string): Promise<ScheduleTemplate | null>;
  findOne(id: string): Promise<ScheduleTemplate | null>;
  remove(entity: ScheduleTemplate): Promise<ScheduleTemplate>;
}

export interface IScheduleTemplateI18nRepository {
  upsert(
    companyId: string,
    scheduleTemplateId: string,
    locale: string,
    data: { name: string; description?: string },
  ): Promise<ScheduleTemplateI18n>;
  findByTemplate(scheduleTemplateId: string): Promise<ScheduleTemplateI18n[]>;
  deleteByTemplate(scheduleTemplateId: string): Promise<void>;
}

export interface IShiftTemplateRepository {
  create(data: Partial<ShiftTemplate>): ShiftTemplate;
  save(entity: ShiftTemplate): Promise<ShiftTemplate>;
  findByCompany(companyId: string): Promise<ShiftTemplate[]>;
  findByCode(companyId: string, code: string): Promise<ShiftTemplate | null>;
  findOne(id: string): Promise<ShiftTemplate | null>;
  remove(entity: ShiftTemplate): Promise<ShiftTemplate>;
}

export interface IShiftTemplateI18nRepository {
  upsert(
    companyId: string,
    shiftTemplateId: string,
    locale: string,
    data: { name: string; description?: string },
  ): Promise<ShiftTemplateI18n>;
  findByTemplate(shiftTemplateId: string): Promise<ShiftTemplateI18n[]>;
  deleteByTemplate(shiftTemplateId: string): Promise<void>;
}

export interface IEmployeeScheduleRepository {
  create(data: Partial<EmployeeSchedule>): EmployeeSchedule;
  save(entity: EmployeeSchedule): Promise<EmployeeSchedule>;
  findByEmployee(
    companyId: string,
    employeeId: string,
  ): Promise<EmployeeSchedule[]>;
  findOne(id: string): Promise<EmployeeSchedule | null>;
  findPaginated(options: {
    companyId: string;
    employeeId?: string;
    scheduleTemplateId?: string;
    isActive?: boolean;
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ data: EmployeeSchedule[]; total: number }>;
  findOverlapping(
    companyId: string,
    employeeId: string,
    effectiveFrom: Date,
    effectiveUntil?: Date,
    excludeId?: string,
  ): Promise<EmployeeSchedule[]>;
  remove(entity: EmployeeSchedule): Promise<EmployeeSchedule>;
}

// ─── Implementations ────────────────────────────────────────

@Injectable()
export class TypeOrmScheduleTemplateRepository implements IScheduleTemplateRepository {
  private readonly repo: Repository<ScheduleTemplate>;
  constructor(@InjectDataSource() ds: DataSource) {
    this.repo = ds.getRepository(ScheduleTemplate);
  }

  create(data: Partial<ScheduleTemplate>): ScheduleTemplate {
    return this.repo.create(data);
  }
  save(entity: ScheduleTemplate): Promise<ScheduleTemplate> {
    return this.repo.save(entity);
  }
  findByCompany(companyId: string): Promise<ScheduleTemplate[]> {
    return this.repo.find({
      where: { companyId },
      relations: ['translations'],
      order: { name: 'ASC' },
    });
  }
  findByCode(
    companyId: string,
    code: string,
  ): Promise<ScheduleTemplate | null> {
    return this.repo.findOne({ where: { companyId, code } });
  }
  findOne(id: string): Promise<ScheduleTemplate | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['translations'],
    });
  }
  remove(entity: ScheduleTemplate): Promise<ScheduleTemplate> {
    return this.repo.remove(entity);
  }
}

@Injectable()
export class TypeOrmScheduleTemplateI18nRepository implements IScheduleTemplateI18nRepository {
  private readonly repo: Repository<ScheduleTemplateI18n>;
  constructor(@InjectDataSource() ds: DataSource) {
    this.repo = ds.getRepository(ScheduleTemplateI18n);
  }

  async upsert(
    companyId: string,
    scheduleTemplateId: string,
    locale: string,
    data: { name: string; description?: string },
  ): Promise<ScheduleTemplateI18n> {
    let entity = await this.repo.findOne({
      where: { scheduleTemplateId, locale },
    });
    if (entity) {
      entity.name = data.name;
      entity.description = data.description ?? null;
    } else {
      entity = this.repo.create({
        companyId,
        scheduleTemplateId,
        locale,
        name: data.name,
        description: data.description ?? null,
      });
    }
    return this.repo.save(entity);
  }

  findByTemplate(scheduleTemplateId: string): Promise<ScheduleTemplateI18n[]> {
    return this.repo.find({ where: { scheduleTemplateId } });
  }

  async deleteByTemplate(scheduleTemplateId: string): Promise<void> {
    await this.repo.delete({ scheduleTemplateId });
  }
}

@Injectable()
export class TypeOrmShiftTemplateRepository implements IShiftTemplateRepository {
  private readonly repo: Repository<ShiftTemplate>;
  constructor(@InjectDataSource() ds: DataSource) {
    this.repo = ds.getRepository(ShiftTemplate);
  }

  create(data: Partial<ShiftTemplate>): ShiftTemplate {
    return this.repo.create(data);
  }
  save(entity: ShiftTemplate): Promise<ShiftTemplate> {
    return this.repo.save(entity);
  }
  findByCompany(companyId: string): Promise<ShiftTemplate[]> {
    return this.repo.find({
      where: { companyId },
      relations: ['translations'],
      order: { name: 'ASC' },
    });
  }
  findByCode(companyId: string, code: string): Promise<ShiftTemplate | null> {
    return this.repo.findOne({ where: { companyId, code } });
  }
  findOne(id: string): Promise<ShiftTemplate | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['translations'],
    });
  }
  remove(entity: ShiftTemplate): Promise<ShiftTemplate> {
    return this.repo.remove(entity);
  }
}

@Injectable()
export class TypeOrmShiftTemplateI18nRepository implements IShiftTemplateI18nRepository {
  private readonly repo: Repository<ShiftTemplateI18n>;
  constructor(@InjectDataSource() ds: DataSource) {
    this.repo = ds.getRepository(ShiftTemplateI18n);
  }

  async upsert(
    companyId: string,
    shiftTemplateId: string,
    locale: string,
    data: { name: string; description?: string },
  ): Promise<ShiftTemplateI18n> {
    let entity = await this.repo.findOne({
      where: { shiftTemplateId, locale },
    });
    if (entity) {
      entity.name = data.name;
      entity.description = data.description ?? null;
    } else {
      entity = this.repo.create({
        companyId,
        shiftTemplateId,
        locale,
        name: data.name,
        description: data.description ?? null,
      });
    }
    return this.repo.save(entity);
  }

  findByTemplate(shiftTemplateId: string): Promise<ShiftTemplateI18n[]> {
    return this.repo.find({ where: { shiftTemplateId } });
  }

  async deleteByTemplate(shiftTemplateId: string): Promise<void> {
    await this.repo.delete({ shiftTemplateId });
  }
}

@Injectable()
export class TypeOrmEmployeeScheduleRepository implements IEmployeeScheduleRepository {
  private readonly repo: Repository<EmployeeSchedule>;
  constructor(@InjectDataSource() ds: DataSource) {
    this.repo = ds.getRepository(EmployeeSchedule);
  }

  create(data: Partial<EmployeeSchedule>): EmployeeSchedule {
    return this.repo.create(data);
  }
  save(entity: EmployeeSchedule): Promise<EmployeeSchedule> {
    return this.repo.save(entity);
  }
  findByEmployee(
    companyId: string,
    employeeId: string,
  ): Promise<EmployeeSchedule[]> {
    return this.repo.find({
      where: { companyId, employeeId },
      relations: ['scheduleTemplate', 'shiftTemplate'],
      order: { effectiveFrom: 'DESC' },
    });
  }
  findOne(id: string): Promise<EmployeeSchedule | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['employee', 'scheduleTemplate', 'shiftTemplate'],
    });
  }
  async findPaginated(options: {
    companyId: string;
    employeeId?: string;
    scheduleTemplateId?: string;
    isActive?: boolean;
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ data: EmployeeSchedule[]; total: number }> {
    const qb = this.repo
      .createQueryBuilder('es')
      .leftJoinAndSelect('es.employee', 'emp')
      .leftJoinAndSelect('es.scheduleTemplate', 'st')
      .leftJoinAndSelect('es.shiftTemplate', 'sht')
      .where('es.companyId = :companyId', { companyId: options.companyId });

    if (options.employeeId)
      qb.andWhere('es.employeeId = :employeeId', {
        employeeId: options.employeeId,
      });
    if (options.scheduleTemplateId)
      qb.andWhere('es.scheduleTemplateId = :scheduleTemplateId', {
        scheduleTemplateId: options.scheduleTemplateId,
      });
    if (options.isActive !== undefined)
      qb.andWhere('es.isActive = :isActive', { isActive: options.isActive });
    if (options.search)
      qb.andWhere('es.notes ILIKE :search', { search: `%${options.search}%` });

    qb.orderBy('es.effectiveFrom', 'DESC')
      .skip((options.page - 1) * options.limit)
      .take(options.limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }
  findOverlapping(
    companyId: string,
    employeeId: string,
    effectiveFrom: Date,
    effectiveUntil?: Date,
    excludeId?: string,
  ): Promise<EmployeeSchedule[]> {
    const qb = this.repo
      .createQueryBuilder('es')
      .where('es.companyId = :companyId', { companyId })
      .andWhere('es.employeeId = :employeeId', { employeeId })
      .andWhere('es.isActive = true');

    if (excludeId) {
      qb.andWhere('es.id != :excludeId', { excludeId });
    }

    if (effectiveUntil) {
      // New assignment has an end date: overlap if existing starts before new ends AND existing ends after new starts (or has no end)
      qb.andWhere('es.effectiveFrom <= :effectiveUntil', { effectiveUntil });
      qb.andWhere(
        '(es.effectiveUntil IS NULL OR es.effectiveUntil >= :effectiveFrom)',
        { effectiveFrom },
      );
    } else {
      // New assignment is open-ended: overlap if existing has no end or ends after new starts
      qb.andWhere(
        '(es.effectiveUntil IS NULL OR es.effectiveUntil >= :effectiveFrom)',
        { effectiveFrom },
      );
    }

    return qb.getMany();
  }
  remove(entity: EmployeeSchedule): Promise<EmployeeSchedule> {
    return this.repo.remove(entity);
  }
}
