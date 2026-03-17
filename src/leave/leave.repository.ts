import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository, FindOptionsWhere } from 'typeorm';
import { LeaveType } from './entities/leave-type.entity';
import { LeaveTypeI18n } from './entities/leave-type-i18n.entity';
import { LeavePolicy } from './entities/leave-policy.entity';
import { LeavePolicyI18n } from './entities/leave-policy-i18n.entity';
import { LeaveEntitlementRule } from './entities/leave-entitlement-rule.entity';
import { LeaveGrant } from './entities/leave-grant.entity';
import { LeaveBalanceLedger } from './entities/leave-balance-ledger.entity';
import { LeaveRequest } from './entities/leave-request.entity';
import { LeaveRequestSegment } from './entities/leave-request-segment.entity';
import { LeaveGrantStatus } from './enums/leave.enums';

// ─── Interfaces ─────────────────────────────────────────────

export interface LeaveTypeRepository {
  create(data: Partial<LeaveType>): LeaveType;
  save(entity: LeaveType): Promise<LeaveType>;
  findByCompany(
    companyId: string,
    includeSystem?: boolean,
  ): Promise<LeaveType[]>;
  findOne(id: string): Promise<LeaveType | null>;
  findByCode(companyId: string, code: string): Promise<LeaveType | null>;
  remove(entity: LeaveType): Promise<LeaveType>;
}

export interface LeaveTypeI18nRepository {
  upsert(
    companyId: string,
    leaveTypeId: string,
    locale: string,
    name: string,
    description?: string,
  ): Promise<LeaveTypeI18n>;
  findByLeaveType(leaveTypeId: string): Promise<LeaveTypeI18n[]>;
  deleteByLeaveType(leaveTypeId: string): Promise<void>;
}

export interface LeavePolicyRepository {
  create(data: Partial<LeavePolicy>): LeavePolicy;
  save(entity: LeavePolicy): Promise<LeavePolicy>;
  findByCompany(companyId: string): Promise<LeavePolicy[]>;
  findOne(id: string): Promise<LeavePolicy | null>;
  findByLeaveType(
    companyId: string,
    leaveTypeId: string,
  ): Promise<LeavePolicy[]>;
  remove(entity: LeavePolicy): Promise<LeavePolicy>;
}

export interface LeavePolicyI18nRepository {
  upsert(
    companyId: string,
    leavePolicyId: string,
    locale: string,
    name: string,
    description?: string,
  ): Promise<LeavePolicyI18n>;
  findByPolicy(leavePolicyId: string): Promise<LeavePolicyI18n[]>;
  deleteByPolicy(leavePolicyId: string): Promise<void>;
}

export interface LeaveEntitlementRuleRepository {
  create(data: Partial<LeaveEntitlementRule>): LeaveEntitlementRule;
  save(entity: LeaveEntitlementRule): Promise<LeaveEntitlementRule>;
  saveAll(entities: LeaveEntitlementRule[]): Promise<LeaveEntitlementRule[]>;
  findByPolicy(policyId: string): Promise<LeaveEntitlementRule[]>;
  findOne(id: string): Promise<LeaveEntitlementRule | null>;
  deleteByPolicyId(policyId: string): Promise<void>;
}

export interface LeaveGrantRepository {
  create(data: Partial<LeaveGrant>): LeaveGrant;
  save(entity: LeaveGrant): Promise<LeaveGrant>;
  findByEmployee(companyId: string, employeeId: string): Promise<LeaveGrant[]>;
  findActiveByEmployeeAndType(
    employeeId: string,
    leaveTypeId: string,
    asOfDate: Date,
  ): Promise<LeaveGrant[]>;
  findOne(id: string): Promise<LeaveGrant | null>;
}

export interface LeaveBalanceLedgerRepository {
  create(data: Partial<LeaveBalanceLedger>): LeaveBalanceLedger;
  save(entity: LeaveBalanceLedger): Promise<LeaveBalanceLedger>;
  findByEmployee(
    companyId: string,
    employeeId: string,
  ): Promise<LeaveBalanceLedger[]>;
  findByGrant(grantId: string): Promise<LeaveBalanceLedger[]>;
}

export interface LeaveRequestRepository {
  create(data: Partial<LeaveRequest>): LeaveRequest;
  save(entity: LeaveRequest): Promise<LeaveRequest>;
  findPaginated(options: {
    companyId: string;
    employeeId?: string;
    status?: string;
    leaveTypeId?: string;
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ data: LeaveRequest[]; total: number }>;
  findOne(id: string): Promise<LeaveRequest | null>;
  findOverlapping(
    employeeId: string,
    startDate: Date,
    endDate: Date,
    excludeId?: string,
  ): Promise<LeaveRequest[]>;
}

export interface LeaveRequestSegmentRepository {
  create(data: Partial<LeaveRequestSegment>): LeaveRequestSegment;
  saveAll(entities: LeaveRequestSegment[]): Promise<LeaveRequestSegment[]>;
  deleteByRequestId(requestId: string): Promise<void>;
}

// ─── Implementations ────────────────────────────────────────

@Injectable()
export class TypeOrmLeaveTypeRepository implements LeaveTypeRepository {
  private readonly repo: Repository<LeaveType>;
  constructor(@InjectDataSource() ds: DataSource) {
    this.repo = ds.getRepository(LeaveType);
  }

  create(data: Partial<LeaveType>): LeaveType {
    return this.repo.create(data);
  }
  save(entity: LeaveType): Promise<LeaveType> {
    return this.repo.save(entity);
  }
  findByCompany(companyId: string, includeSystem = true): Promise<LeaveType[]> {
    const where: FindOptionsWhere<LeaveType>[] = [{ companyId }];
    if (includeSystem) where.push({ isSystem: true, companyId: null as any });
    return this.repo.find({
      where,
      relations: ['translations'],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }
  findOne(id: string): Promise<LeaveType | null> {
    return this.repo.findOne({ where: { id }, relations: ['translations'] });
  }
  findByCode(companyId: string, code: string): Promise<LeaveType | null> {
    return this.repo.findOne({
      where: [
        { companyId, code },
        { companyId: null as any, code, isSystem: true },
      ],
    });
  }
  remove(entity: LeaveType): Promise<LeaveType> {
    return this.repo.remove(entity);
  }
}

@Injectable()
export class TypeOrmLeaveTypeI18nRepository implements LeaveTypeI18nRepository {
  private readonly repo: Repository<LeaveTypeI18n>;
  constructor(@InjectDataSource() ds: DataSource) {
    this.repo = ds.getRepository(LeaveTypeI18n);
  }

  async upsert(
    companyId: string,
    leaveTypeId: string,
    locale: string,
    name: string,
    description?: string,
  ): Promise<LeaveTypeI18n> {
    const existing = await this.repo.findOne({
      where: { leaveTypeId, locale },
    });
    if (existing) {
      existing.name = name;
      existing.description = description ?? null;
      return this.repo.save(existing);
    }
    const entity = this.repo.create({
      companyId,
      leaveTypeId,
      locale,
      name,
      description: description ?? null,
    });
    return this.repo.save(entity);
  }
  findByLeaveType(leaveTypeId: string): Promise<LeaveTypeI18n[]> {
    return this.repo.find({ where: { leaveTypeId }, order: { locale: 'ASC' } });
  }
  async deleteByLeaveType(leaveTypeId: string): Promise<void> {
    await this.repo.delete({ leaveTypeId });
  }
}

@Injectable()
export class TypeOrmLeavePolicyRepository implements LeavePolicyRepository {
  private readonly repo: Repository<LeavePolicy>;
  constructor(@InjectDataSource() ds: DataSource) {
    this.repo = ds.getRepository(LeavePolicy);
  }

  create(data: Partial<LeavePolicy>): LeavePolicy {
    return this.repo.create(data);
  }
  save(entity: LeavePolicy): Promise<LeavePolicy> {
    return this.repo.save(entity);
  }
  findByCompany(companyId: string): Promise<LeavePolicy[]> {
    return this.repo.find({
      where: { companyId },
      relations: ['leaveType', 'entitlementRules', 'translations'],
      order: { priority: 'ASC' },
    });
  }
  findOne(id: string): Promise<LeavePolicy | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['leaveType', 'entitlementRules', 'translations'],
    });
  }
  findByLeaveType(
    companyId: string,
    leaveTypeId: string,
  ): Promise<LeavePolicy[]> {
    return this.repo.find({
      where: { companyId, leaveTypeId },
      relations: ['entitlementRules'],
      order: { priority: 'ASC' },
    });
  }
  remove(entity: LeavePolicy): Promise<LeavePolicy> {
    return this.repo.remove(entity);
  }
}

@Injectable()
export class TypeOrmLeavePolicyI18nRepository implements LeavePolicyI18nRepository {
  private readonly repo: Repository<LeavePolicyI18n>;
  constructor(@InjectDataSource() ds: DataSource) {
    this.repo = ds.getRepository(LeavePolicyI18n);
  }

  async upsert(
    companyId: string,
    leavePolicyId: string,
    locale: string,
    name: string,
    description?: string,
  ): Promise<LeavePolicyI18n> {
    const existing = await this.repo.findOne({
      where: { leavePolicyId, locale },
    });
    if (existing) {
      existing.name = name;
      existing.description = description ?? null;
      return this.repo.save(existing);
    }
    const entity = this.repo.create({
      companyId,
      leavePolicyId,
      locale,
      name,
      description: description ?? null,
    });
    return this.repo.save(entity);
  }
  findByPolicy(leavePolicyId: string): Promise<LeavePolicyI18n[]> {
    return this.repo.find({
      where: { leavePolicyId },
      order: { locale: 'ASC' },
    });
  }
  async deleteByPolicy(leavePolicyId: string): Promise<void> {
    await this.repo.delete({ leavePolicyId });
  }
}

@Injectable()
export class TypeOrmLeaveEntitlementRuleRepository implements LeaveEntitlementRuleRepository {
  private readonly repo: Repository<LeaveEntitlementRule>;
  constructor(@InjectDataSource() ds: DataSource) {
    this.repo = ds.getRepository(LeaveEntitlementRule);
  }

  create(data: Partial<LeaveEntitlementRule>): LeaveEntitlementRule {
    return this.repo.create(data);
  }
  save(entity: LeaveEntitlementRule): Promise<LeaveEntitlementRule> {
    return this.repo.save(entity);
  }
  saveAll(entities: LeaveEntitlementRule[]): Promise<LeaveEntitlementRule[]> {
    return this.repo.save(entities);
  }
  findByPolicy(policyId: string): Promise<LeaveEntitlementRule[]> {
    return this.repo.find({ where: { leavePolicyId: policyId } });
  }
  findOne(id: string): Promise<LeaveEntitlementRule | null> {
    return this.repo.findOne({ where: { id } });
  }
  async deleteByPolicyId(policyId: string): Promise<void> {
    await this.repo.delete({ leavePolicyId: policyId });
  }
}

@Injectable()
export class TypeOrmLeaveGrantRepository implements LeaveGrantRepository {
  private readonly repo: Repository<LeaveGrant>;
  constructor(@InjectDataSource() ds: DataSource) {
    this.repo = ds.getRepository(LeaveGrant);
  }

  create(data: Partial<LeaveGrant>): LeaveGrant {
    return this.repo.create(data);
  }
  save(entity: LeaveGrant): Promise<LeaveGrant> {
    return this.repo.save(entity);
  }
  findByEmployee(companyId: string, employeeId: string): Promise<LeaveGrant[]> {
    return this.repo.find({
      where: { companyId, employeeId },
      relations: ['leaveType'],
      order: { validFrom: 'ASC' },
    });
  }
  async findActiveByEmployeeAndType(
    employeeId: string,
    leaveTypeId: string,
    asOfDate: Date,
  ): Promise<LeaveGrant[]> {
    return this.repo
      .createQueryBuilder('g')
      .where('g.employeeId = :employeeId', { employeeId })
      .andWhere('g.leaveTypeId = :leaveTypeId', { leaveTypeId })
      .andWhere('g.status = :status', { status: LeaveGrantStatus.ACTIVE })
      .andWhere('g.validFrom <= :asOfDate', { asOfDate })
      .andWhere('(g.validUntil IS NULL OR g.validUntil >= :asOfDate)', {
        asOfDate,
      })
      .andWhere('g.remainingAmount > 0')
      .orderBy('g.validUntil', 'ASC', 'NULLS LAST')
      .getMany();
  }
  findOne(id: string): Promise<LeaveGrant | null> {
    return this.repo.findOne({ where: { id }, relations: ['leaveType'] });
  }
}

@Injectable()
export class TypeOrmLeaveBalanceLedgerRepository implements LeaveBalanceLedgerRepository {
  private readonly repo: Repository<LeaveBalanceLedger>;
  constructor(@InjectDataSource() ds: DataSource) {
    this.repo = ds.getRepository(LeaveBalanceLedger);
  }

  create(data: Partial<LeaveBalanceLedger>): LeaveBalanceLedger {
    return this.repo.create(data);
  }
  save(entity: LeaveBalanceLedger): Promise<LeaveBalanceLedger> {
    return this.repo.save(entity);
  }
  findByEmployee(
    companyId: string,
    employeeId: string,
  ): Promise<LeaveBalanceLedger[]> {
    return this.repo.find({
      where: { companyId, employeeId },
      order: { occurredAt: 'DESC' },
    });
  }
  findByGrant(grantId: string): Promise<LeaveBalanceLedger[]> {
    return this.repo.find({
      where: { leaveGrantId: grantId },
      order: { occurredAt: 'DESC' },
    });
  }
}

@Injectable()
export class TypeOrmLeaveRequestRepository implements LeaveRequestRepository {
  private readonly repo: Repository<LeaveRequest>;
  constructor(@InjectDataSource() ds: DataSource) {
    this.repo = ds.getRepository(LeaveRequest);
  }

  create(data: Partial<LeaveRequest>): LeaveRequest {
    return this.repo.create(data);
  }
  save(entity: LeaveRequest): Promise<LeaveRequest> {
    return this.repo.save(entity);
  }
  async findPaginated(options: {
    companyId: string;
    employeeId?: string;
    status?: string;
    leaveTypeId?: string;
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ data: LeaveRequest[]; total: number }> {
    const qb = this.repo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.leaveType', 'lt')
      .leftJoinAndSelect('r.segments', 's')
      .where('r.companyId = :companyId', { companyId: options.companyId });

    if (options.employeeId)
      qb.andWhere('r.employeeId = :employeeId', {
        employeeId: options.employeeId,
      });
    if (options.status)
      qb.andWhere('r.status = :status', { status: options.status });
    if (options.leaveTypeId)
      qb.andWhere('r.leaveTypeId = :leaveTypeId', {
        leaveTypeId: options.leaveTypeId,
      });
    if (options.search)
      qb.andWhere('r.reason ILIKE :search', { search: `%${options.search}%` });

    qb.orderBy('r.createdAt', 'DESC')
      .skip((options.page - 1) * options.limit)
      .take(options.limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }
  findOne(id: string): Promise<LeaveRequest | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['leaveType', 'segments', 'matchedPolicy'],
    });
  }
  findOverlapping(
    employeeId: string,
    startDate: Date,
    endDate: Date,
    excludeId?: string,
  ): Promise<LeaveRequest[]> {
    const qb = this.repo
      .createQueryBuilder('r')
      .where('r.employeeId = :employeeId', { employeeId })
      .andWhere('r.status NOT IN (:...excludeStatuses)', {
        excludeStatuses: ['CANCELLED', 'REJECTED'],
      })
      .andWhere('r.startDate <= :endDate', { endDate })
      .andWhere('r.endDate >= :startDate', { startDate });

    if (excludeId) qb.andWhere('r.id != :excludeId', { excludeId });
    return qb.getMany();
  }
}

@Injectable()
export class TypeOrmLeaveRequestSegmentRepository implements LeaveRequestSegmentRepository {
  private readonly repo: Repository<LeaveRequestSegment>;
  constructor(@InjectDataSource() ds: DataSource) {
    this.repo = ds.getRepository(LeaveRequestSegment);
  }

  create(data: Partial<LeaveRequestSegment>): LeaveRequestSegment {
    return this.repo.create(data);
  }
  saveAll(entities: LeaveRequestSegment[]): Promise<LeaveRequestSegment[]> {
    return this.repo.save(entities);
  }
  async deleteByRequestId(requestId: string): Promise<void> {
    await this.repo.delete({ leaveRequestId: requestId });
  }
}
