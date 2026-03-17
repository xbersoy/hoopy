import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
  LeaveType,
  LeaveTypeI18n,
  LeavePolicy,
  LeavePolicyI18n,
  LeaveEntitlementRule,
  LeaveGrant,
  LeaveBalanceLedger,
  LeaveRequest,
  LeaveRequestSegment,
} from './entities';

import {
  TypeOrmLeaveTypeRepository,
  TypeOrmLeaveTypeI18nRepository,
  TypeOrmLeavePolicyRepository,
  TypeOrmLeavePolicyI18nRepository,
  TypeOrmLeaveEntitlementRuleRepository,
  TypeOrmLeaveGrantRepository,
  TypeOrmLeaveBalanceLedgerRepository,
  TypeOrmLeaveRequestRepository,
  TypeOrmLeaveRequestSegmentRepository,
} from './leave.repository';

import { LeaveTypeService } from './services/leave-type.service';
import { LeavePolicyService } from './services/leave-policy.service';
import { LeaveGrantService } from './services/leave-grant.service';
import { LeaveBalanceService } from './services/leave-balance.service';
import { LeaveRequestService } from './services/leave-request.service';

import { LeaveTypeController } from './controllers/leave-type.controller';
import { LeavePolicyController } from './controllers/leave-policy.controller';
import { LeaveRequestController } from './controllers/leave-request.controller';
import { LeaveBalanceController } from './controllers/leave-balance.controller';

import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LeaveType,
      LeaveTypeI18n,
      LeavePolicy,
      LeavePolicyI18n,
      LeaveEntitlementRule,
      LeaveGrant,
      LeaveBalanceLedger,
      LeaveRequest,
      LeaveRequestSegment,
    ]),
    PermissionsModule,
  ],
  controllers: [
    LeaveTypeController,
    LeavePolicyController,
    LeaveRequestController,
    LeaveBalanceController,
  ],
  providers: [
    // Services
    LeaveTypeService,
    LeavePolicyService,
    LeaveGrantService,
    LeaveBalanceService,
    LeaveRequestService,

    // Repositories
    { provide: 'LeaveTypeRepository', useClass: TypeOrmLeaveTypeRepository },
    {
      provide: 'LeaveTypeI18nRepository',
      useClass: TypeOrmLeaveTypeI18nRepository,
    },
    {
      provide: 'LeavePolicyRepository',
      useClass: TypeOrmLeavePolicyRepository,
    },
    {
      provide: 'LeavePolicyI18nRepository',
      useClass: TypeOrmLeavePolicyI18nRepository,
    },
    {
      provide: 'LeaveEntitlementRuleRepository',
      useClass: TypeOrmLeaveEntitlementRuleRepository,
    },
    { provide: 'LeaveGrantRepository', useClass: TypeOrmLeaveGrantRepository },
    {
      provide: 'LeaveBalanceLedgerRepository',
      useClass: TypeOrmLeaveBalanceLedgerRepository,
    },
    {
      provide: 'LeaveRequestRepository',
      useClass: TypeOrmLeaveRequestRepository,
    },
    {
      provide: 'LeaveRequestSegmentRepository',
      useClass: TypeOrmLeaveRequestSegmentRepository,
    },
  ],
  exports: [
    LeaveTypeService,
    LeavePolicyService,
    LeaveGrantService,
    LeaveBalanceService,
    LeaveRequestService,
  ],
})
export class LeaveModule {}
