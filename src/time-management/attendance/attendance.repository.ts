import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AttendanceRecord } from './entities/attendance-record.entity';
import { AttendanceCorrectionRequest } from './entities/attendance-correction-request.entity';

// ─── Interfaces ─────────────────────────────────────────────

export interface AttendanceRecordRepository {
  create(data: Partial<AttendanceRecord>): AttendanceRecord;
  save(entity: AttendanceRecord): Promise<AttendanceRecord>;
  findByCompanyAndDate(
    companyId: string,
    date: Date,
  ): Promise<AttendanceRecord[]>;
  findByEmployee(
    companyId: string,
    employeeId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<AttendanceRecord[]>;
  findOne(id: string): Promise<AttendanceRecord | null>;
  findPaginated(options: {
    companyId: string;
    employeeId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ data: AttendanceRecord[]; total: number }>;
  remove(entity: AttendanceRecord): Promise<AttendanceRecord>;
}

export interface AttendanceCorrectionRepository {
  create(
    data: Partial<AttendanceCorrectionRequest>,
  ): AttendanceCorrectionRequest;
  save(
    entity: AttendanceCorrectionRequest,
  ): Promise<AttendanceCorrectionRequest>;
  findPaginated(options: {
    companyId: string;
    employeeId?: string;
    status?: string;
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ data: AttendanceCorrectionRequest[]; total: number }>;
  findOne(id: string): Promise<AttendanceCorrectionRequest | null>;
  findByEmployee(
    companyId: string,
    employeeId: string,
  ): Promise<AttendanceCorrectionRequest[]>;
}

// ─── Implementations ────────────────────────────────────────

@Injectable()
export class TypeOrmAttendanceRecordRepository implements AttendanceRecordRepository {
  private readonly repo: Repository<AttendanceRecord>;
  constructor(@InjectDataSource() ds: DataSource) {
    this.repo = ds.getRepository(AttendanceRecord);
  }

  create(data: Partial<AttendanceRecord>): AttendanceRecord {
    return this.repo.create(data);
  }
  save(entity: AttendanceRecord): Promise<AttendanceRecord> {
    return this.repo.save(entity);
  }
  findByCompanyAndDate(
    companyId: string,
    date: Date,
  ): Promise<AttendanceRecord[]> {
    return this.repo.find({
      where: { companyId, date },
      relations: ['employee'],
      order: { createdAt: 'DESC' },
    });
  }
  findByEmployee(
    companyId: string,
    employeeId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<AttendanceRecord[]> {
    const qb = this.repo
      .createQueryBuilder('ar')
      .where('ar.companyId = :companyId', { companyId })
      .andWhere('ar.employeeId = :employeeId', { employeeId });

    if (startDate) qb.andWhere('ar.date >= :startDate', { startDate });
    if (endDate) qb.andWhere('ar.date <= :endDate', { endDate });

    return qb.orderBy('ar.date', 'DESC').getMany();
  }
  findOne(id: string): Promise<AttendanceRecord | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['employee'],
    });
  }
  async findPaginated(options: {
    companyId: string;
    employeeId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ data: AttendanceRecord[]; total: number }> {
    const qb = this.repo
      .createQueryBuilder('ar')
      .leftJoinAndSelect('ar.employee', 'emp')
      .where('ar.companyId = :companyId', { companyId: options.companyId });

    if (options.employeeId)
      qb.andWhere('ar.employeeId = :employeeId', {
        employeeId: options.employeeId,
      });
    if (options.status)
      qb.andWhere('ar.status = :status', { status: options.status });
    if (options.startDate)
      qb.andWhere('ar.date >= :startDate', { startDate: options.startDate });
    if (options.endDate)
      qb.andWhere('ar.date <= :endDate', { endDate: options.endDate });
    if (options.search)
      qb.andWhere('ar.notes ILIKE :search', { search: `%${options.search}%` });

    qb.orderBy('ar.date', 'DESC')
      .skip((options.page - 1) * options.limit)
      .take(options.limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }
  remove(entity: AttendanceRecord): Promise<AttendanceRecord> {
    return this.repo.remove(entity);
  }
}

@Injectable()
export class TypeOrmAttendanceCorrectionRepository implements AttendanceCorrectionRepository {
  private readonly repo: Repository<AttendanceCorrectionRequest>;
  constructor(@InjectDataSource() ds: DataSource) {
    this.repo = ds.getRepository(AttendanceCorrectionRequest);
  }

  create(
    data: Partial<AttendanceCorrectionRequest>,
  ): AttendanceCorrectionRequest {
    return this.repo.create(data);
  }
  save(
    entity: AttendanceCorrectionRequest,
  ): Promise<AttendanceCorrectionRequest> {
    return this.repo.save(entity);
  }
  async findPaginated(options: {
    companyId: string;
    employeeId?: string;
    status?: string;
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ data: AttendanceCorrectionRequest[]; total: number }> {
    const qb = this.repo
      .createQueryBuilder('cr')
      .leftJoinAndSelect('cr.employee', 'emp')
      .leftJoinAndSelect('cr.attendanceRecord', 'ar')
      .where('cr.companyId = :companyId', { companyId: options.companyId });

    if (options.employeeId)
      qb.andWhere('cr.employeeId = :employeeId', {
        employeeId: options.employeeId,
      });
    if (options.status)
      qb.andWhere('cr.status = :status', { status: options.status });
    if (options.search)
      qb.andWhere('cr.reason ILIKE :search', { search: `%${options.search}%` });

    qb.orderBy('cr.createdAt', 'DESC')
      .skip((options.page - 1) * options.limit)
      .take(options.limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }
  findOne(id: string): Promise<AttendanceCorrectionRequest | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['employee', 'attendanceRecord'],
    });
  }
  findByEmployee(
    companyId: string,
    employeeId: string,
  ): Promise<AttendanceCorrectionRequest[]> {
    return this.repo.find({
      where: { companyId, employeeId },
      relations: ['attendanceRecord'],
      order: { createdAt: 'DESC' },
    });
  }
}
