import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { OvertimeRequest } from './entities/overtime-request.entity';
import { CompOffGrant } from './entities/comp-off-grant.entity';
import { CompOffStatus } from './enums/overtime.enums';

// ─── Interfaces ─────────────────────────────────────────────

export interface OvertimeRequestRepository {
  create(data: Partial<OvertimeRequest>): OvertimeRequest;
  save(entity: OvertimeRequest): Promise<OvertimeRequest>;
  findPaginated(options: {
    companyId: string;
    employeeId?: string;
    status?: string;
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ data: OvertimeRequest[]; total: number }>;
  findOne(id: string): Promise<OvertimeRequest | null>;
  findByEmployee(
    companyId: string,
    employeeId: string,
  ): Promise<OvertimeRequest[]>;
}

export interface CompOffGrantRepository {
  create(data: Partial<CompOffGrant>): CompOffGrant;
  save(entity: CompOffGrant): Promise<CompOffGrant>;
  findByEmployee(
    companyId: string,
    employeeId: string,
  ): Promise<CompOffGrant[]>;
  findActive(companyId: string, employeeId: string): Promise<CompOffGrant[]>;
  findOne(id: string): Promise<CompOffGrant | null>;
}

// ─── Implementations ────────────────────────────────────────

@Injectable()
export class TypeOrmOvertimeRequestRepository implements OvertimeRequestRepository {
  private readonly repo: Repository<OvertimeRequest>;
  constructor(@InjectDataSource() ds: DataSource) {
    this.repo = ds.getRepository(OvertimeRequest);
  }

  create(data: Partial<OvertimeRequest>): OvertimeRequest {
    return this.repo.create(data);
  }
  save(entity: OvertimeRequest): Promise<OvertimeRequest> {
    return this.repo.save(entity);
  }
  async findPaginated(options: {
    companyId: string;
    employeeId?: string;
    status?: string;
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ data: OvertimeRequest[]; total: number }> {
    const qb = this.repo
      .createQueryBuilder('or')
      .leftJoinAndSelect('or.employee', 'emp')
      .where('or.companyId = :companyId', { companyId: options.companyId });

    if (options.employeeId)
      qb.andWhere('or.employeeId = :employeeId', {
        employeeId: options.employeeId,
      });
    if (options.status)
      qb.andWhere('or.status = :status', { status: options.status });
    if (options.search)
      qb.andWhere('or.reason ILIKE :search', { search: `%${options.search}%` });

    qb.orderBy('or.date', 'DESC')
      .skip((options.page - 1) * options.limit)
      .take(options.limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }
  findOne(id: string): Promise<OvertimeRequest | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['employee'],
    });
  }
  findByEmployee(
    companyId: string,
    employeeId: string,
  ): Promise<OvertimeRequest[]> {
    return this.repo.find({
      where: { companyId, employeeId },
      order: { date: 'DESC' },
    });
  }
}

@Injectable()
export class TypeOrmCompOffGrantRepository implements CompOffGrantRepository {
  private readonly repo: Repository<CompOffGrant>;
  constructor(@InjectDataSource() ds: DataSource) {
    this.repo = ds.getRepository(CompOffGrant);
  }

  create(data: Partial<CompOffGrant>): CompOffGrant {
    return this.repo.create(data);
  }
  save(entity: CompOffGrant): Promise<CompOffGrant> {
    return this.repo.save(entity);
  }
  findByEmployee(
    companyId: string,
    employeeId: string,
  ): Promise<CompOffGrant[]> {
    return this.repo.find({
      where: { companyId, employeeId },
      relations: ['overtimeRequest'],
      order: { createdAt: 'DESC' },
    });
  }
  findActive(companyId: string, employeeId: string): Promise<CompOffGrant[]> {
    return this.repo.find({
      where: { companyId, employeeId, status: CompOffStatus.ACTIVE },
      relations: ['overtimeRequest'],
      order: { validFrom: 'ASC' },
    });
  }
  findOne(id: string): Promise<CompOffGrant | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['employee', 'overtimeRequest'],
    });
  }
}
