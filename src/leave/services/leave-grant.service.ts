import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { LeaveGrant } from '../entities/leave-grant.entity';
import {
  LeaveGrantRepository,
  LeaveBalanceLedgerRepository,
} from '../leave.repository';
import {
  LeaveGrantStatus,
  GrantSourceType,
  BalanceTransactionType,
  BalanceActorType,
} from '../enums/leave.enums';

@Injectable()
export class LeaveGrantService {
  constructor(
    @Inject('LeaveGrantRepository')
    private readonly grantRepository: LeaveGrantRepository,

    @Inject('LeaveBalanceLedgerRepository')
    private readonly ledgerRepository: LeaveBalanceLedgerRepository,
  ) {}

  async createGrant(
    companyId: string,
    data: {
      employeeId: string;
      leaveTypeId: string;
      leavePolicyId?: string;
      entitlementRuleId?: string;
      grantReason?: string;
      grantedAmount: number;
      validFrom: Date;
      validUntil?: Date;
      sourceType: GrantSourceType;
    },
    actorId?: string,
  ): Promise<LeaveGrant> {
    const grant = this.grantRepository.create({
      companyId,
      employeeId: data.employeeId,
      leaveTypeId: data.leaveTypeId,
      leavePolicyId: data.leavePolicyId || null,
      entitlementRuleId: data.entitlementRuleId || null,
      grantReason: data.grantReason || null,
      grantedAmount: data.grantedAmount,
      consumedAmount: 0,
      reservedAmount: 0,
      remainingAmount: data.grantedAmount,
      validFrom: data.validFrom,
      validUntil: data.validUntil || null,
      grantedAt: new Date(),
      sourceType: data.sourceType,
      status: LeaveGrantStatus.ACTIVE,
    });
    const saved = await this.grantRepository.save(grant);

    // Write ledger entry
    const ledgerEntry = this.ledgerRepository.create({
      companyId,
      employeeId: data.employeeId,
      leaveTypeId: data.leaveTypeId,
      leaveGrantId: saved.id,
      transactionType: BalanceTransactionType.GRANT,
      amount: data.grantedAmount,
      occurredAt: new Date(),
      effectiveDate: data.validFrom,
      notes: data.grantReason || 'Initial grant',
      actorType: actorId ? BalanceActorType.HR : BalanceActorType.SYSTEM,
      actorId: actorId || null,
    });
    await this.ledgerRepository.save(ledgerEntry);

    return saved;
  }

  async findByEmployee(
    companyId: string,
    employeeId: string,
  ): Promise<LeaveGrant[]> {
    return this.grantRepository.findByEmployee(companyId, employeeId);
  }

  async findActiveByEmployeeAndType(
    employeeId: string,
    leaveTypeId: string,
    asOfDate?: Date,
  ): Promise<LeaveGrant[]> {
    return this.grantRepository.findActiveByEmployeeAndType(
      employeeId,
      leaveTypeId,
      asOfDate || new Date(),
    );
  }

  async findOne(id: string): Promise<LeaveGrant> {
    const entity = await this.grantRepository.findOne(id);
    if (!entity) {
      throw new NotFoundException(`Leave grant with ID "${id}" not found`);
    }
    return entity;
  }

  /**
   * Get aggregated balance summary for an employee per leave type.
   */
  async getBalanceSummary(
    companyId: string,
    employeeId: string,
  ): Promise<
    Array<{
      leaveTypeId: string;
      leaveTypeName: string;
      totalGranted: number;
      totalConsumed: number;
      totalReserved: number;
      totalRemaining: number;
    }>
  > {
    const grants = await this.grantRepository.findByEmployee(
      companyId,
      employeeId,
    );
    const grouped = new Map<
      string,
      {
        leaveTypeId: string;
        leaveTypeName: string;
        granted: number;
        consumed: number;
        reserved: number;
        remaining: number;
      }
    >();

    for (const g of grants) {
      if (g.status === LeaveGrantStatus.CANCELLED) continue;
      const key = g.leaveTypeId;
      if (!grouped.has(key)) {
        grouped.set(key, {
          leaveTypeId: key,
          leaveTypeName: g.leaveType?.name || key,
          granted: 0,
          consumed: 0,
          reserved: 0,
          remaining: 0,
        });
      }
      const entry = grouped.get(key)!;
      entry.granted += Number(g.grantedAmount);
      entry.consumed += Number(g.consumedAmount);
      entry.reserved += Number(g.reservedAmount);
      entry.remaining += Number(g.remainingAmount);
    }

    return Array.from(grouped.values()).map((e) => ({
      leaveTypeId: e.leaveTypeId,
      leaveTypeName: e.leaveTypeName,
      totalGranted: e.granted,
      totalConsumed: e.consumed,
      totalReserved: e.reserved,
      totalRemaining: e.remaining,
    }));
  }
}
