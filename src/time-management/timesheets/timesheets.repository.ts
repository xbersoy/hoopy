import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TimesheetPeriod } from './entities/timesheet-period.entity';
import { TimesheetEntry } from './entities/timesheet-entry.entity';

// ─── Interfaces ─────────────────────────────────────────────

export interface TimesheetPeriodRepository {
  create(data: Partial<TimesheetPeriod>): TimesheetPeriod;
  save(entity: TimesheetPeriod): Promise<TimesheetPeriod>;
  findPaginated(options: {
    companyId: string;
    employeeId?: string;
    status?: string;
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ data: TimesheetPeriod[]; total: number }>;
  findOne(id: string): Promise<TimesheetPeriod | null>;
  findOverlapping(
    companyId: string,
    employeeId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<TimesheetPeriod[]>;
  findByEmployee(
    companyId: string,
    employeeId: string,
  ): Promise<TimesheetPeriod[]>;
  remove(entity: TimesheetPeriod): Promise<TimesheetPeriod>;
}

export interface TimesheetEntryRepository {
  create(data: Partial<TimesheetEntry>): TimesheetEntry;
  saveAll(entities: TimesheetEntry[]): Promise<TimesheetEntry[]>;
  deleteByPeriodId(timesheetPeriodId: string): Promise<void>;
}

// ─── Implementations ────────────────────────────────────────

@Injectable()
export class TypeOrmTimesheetPeriodRepository implements TimesheetPeriodRepository {
  private readonly repo: Repository<TimesheetPeriod>;
  constructor(@InjectDataSource() ds: DataSource) {
    this.repo = ds.getRepository(TimesheetPeriod);
  }

  create(data: Partial<TimesheetPeriod>): TimesheetPeriod {
    return this.repo.create(data);
  }
  save(entity: TimesheetPeriod): Promise<TimesheetPeriod> {
    return this.repo.save(entity);
  }
  async findPaginated(options: {
    companyId: string;
    employeeId?: string;
    status?: string;
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ data: TimesheetPeriod[]; total: number }> {
    const qb = this.repo
      .createQueryBuilder('tp')
      .leftJoinAndSelect('tp.employee', 'emp')
      .where('tp.companyId = :companyId', { companyId: options.companyId });

    if (options.employeeId)
      qb.andWhere('tp.employeeId = :employeeId', {
        employeeId: options.employeeId,
      });
    if (options.status)
      qb.andWhere('tp.status = :status', { status: options.status });

    qb.orderBy('tp.periodStart', 'DESC')
      .skip((options.page - 1) * options.limit)
      .take(options.limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }
  findOne(id: string): Promise<TimesheetPeriod | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['employee', 'entries'],
    });
  }
  findOverlapping(
    companyId: string,
    employeeId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<TimesheetPeriod[]> {
    return this.repo
      .createQueryBuilder('tp')
      .where('tp.companyId = :companyId', { companyId })
      .andWhere('tp.employeeId = :employeeId', { employeeId })
      .andWhere('tp.periodStart <= :periodEnd', { periodEnd })
      .andWhere('tp.periodEnd >= :periodStart', { periodStart })
      .getMany();
  }
  findByEmployee(
    companyId: string,
    employeeId: string,
  ): Promise<TimesheetPeriod[]> {
    return this.repo.find({
      where: { companyId, employeeId },
      relations: ['entries'],
      order: { periodStart: 'DESC' },
    });
  }
  remove(entity: TimesheetPeriod): Promise<TimesheetPeriod> {
    return this.repo.remove(entity);
  }
}

@Injectable()
export class TypeOrmTimesheetEntryRepository implements TimesheetEntryRepository {
  private readonly repo: Repository<TimesheetEntry>;
  constructor(@InjectDataSource() ds: DataSource) {
    this.repo = ds.getRepository(TimesheetEntry);
  }

  create(data: Partial<TimesheetEntry>): TimesheetEntry {
    return this.repo.create(data);
  }
  saveAll(entities: TimesheetEntry[]): Promise<TimesheetEntry[]> {
    return this.repo.save(entities);
  }
  async deleteByPeriodId(timesheetPeriodId: string): Promise<void> {
    await this.repo.delete({ timesheetPeriodId });
  }
}
