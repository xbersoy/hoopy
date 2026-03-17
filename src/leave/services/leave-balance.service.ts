import { Inject, Injectable } from '@nestjs/common';
import { LeaveBalanceLedger } from '../entities/leave-balance-ledger.entity';
import {
  LeaveBalanceLedgerRepository,
  LeaveGrantRepository,
} from '../leave.repository';
import {
  BalanceTransactionType,
  BalanceActorType,
  GrantSourceType,
} from '../enums/leave.enums';
import { AdjustLeaveBalanceDto } from '../dto/adjust-leave-balance.dto';
import { LeaveGrantService } from './leave-grant.service';

@Injectable()
export class LeaveBalanceService {
  constructor(
    @Inject('LeaveBalanceLedgerRepository')
    private readonly ledgerRepository: LeaveBalanceLedgerRepository,

    @Inject('LeaveGrantRepository')
    private readonly grantRepository: LeaveGrantRepository,

    private readonly grantService: LeaveGrantService,
  ) {}

  /**
   * HR manual adjustment — creates a new grant (or adjusts existing one) + ledger entry.
   */
  async adjust(
    companyId: string,
    dto: AdjustLeaveBalanceDto,
    actorId: string,
  ): Promise<LeaveBalanceLedger> {
    if (dto.grantId) {
      // Adjust existing grant
      const grant = await this.grantService.findOne(dto.grantId);
      grant.grantedAmount = Number(grant.grantedAmount) + dto.amount;
      grant.remainingAmount = Number(grant.remainingAmount) + dto.amount;
      await this.grantRepository.save(grant);

      const entry = this.ledgerRepository.create({
        companyId,
        employeeId: dto.employeeId,
        leaveTypeId: dto.leaveTypeId,
        leaveGrantId: dto.grantId,
        transactionType: BalanceTransactionType.ADJUSTMENT,
        amount: dto.amount,
        occurredAt: new Date(),
        effectiveDate: new Date(),
        notes: dto.reason,
        actorType: BalanceActorType.HR,
        actorId,
      });
      return this.ledgerRepository.save(entry);
    }

    // Create a new manual grant
    const grant = await this.grantService.createGrant(
      companyId,
      {
        employeeId: dto.employeeId,
        leaveTypeId: dto.leaveTypeId,
        grantReason: dto.reason,
        grantedAmount: dto.amount,
        validFrom: new Date(),
        sourceType: GrantSourceType.MANUAL_ADJUSTMENT,
      },
      actorId,
    );

    // Ledger entry already created by grantService.createGrant
    const entries = await this.ledgerRepository.findByGrant(grant.id);
    return entries[0];
  }

  async getLedger(companyId: string, employeeId: string): Promise<LeaveBalanceLedger[]> {
    return this.ledgerRepository.findByEmployee(companyId, employeeId);
  }
}
