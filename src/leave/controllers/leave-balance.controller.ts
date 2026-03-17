import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { PermissionsGuard } from '../../permissions/guards/permissions.guard';
import { RequirePermissions } from '../../permissions/decorators/require-permissions.decorator';
import { LeaveBalanceService } from '../services/leave-balance.service';
import { LeaveGrantService } from '../services/leave-grant.service';
import { AdjustLeaveBalanceDto } from '../dto/adjust-leave-balance.dto';

@ApiTags('Leave Balances')
@ApiBearerAuth()
@Controller('leave-balances')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LeaveBalanceController {
  constructor(
    private readonly balanceService: LeaveBalanceService,
    private readonly grantService: LeaveGrantService,
  ) {}

  @Get('employee/:employeeId/summary')
  @RequirePermissions({ action: 'read', resourceType: 'leave-balance' })
  @ApiOperation({ summary: 'Get balance summary for an employee' })
  getBalanceSummary(@Req() req: any, @Param('employeeId') employeeId: string) {
    return this.grantService.getBalanceSummary(req.user.companyId, employeeId);
  }

  @Get('employee/:employeeId/grants')
  @RequirePermissions({ action: 'read', resourceType: 'leave-balance' })
  @ApiOperation({ summary: 'Get all grants for an employee' })
  getGrants(@Req() req: any, @Param('employeeId') employeeId: string) {
    return this.grantService.findByEmployee(req.user.companyId, employeeId);
  }

  @Get('employee/:employeeId/ledger')
  @RequirePermissions({ action: 'read', resourceType: 'leave-balance' })
  @ApiOperation({ summary: 'Get balance ledger for an employee' })
  getLedger(@Req() req: any, @Param('employeeId') employeeId: string) {
    return this.balanceService.getLedger(req.user.companyId, employeeId);
  }

  @Post('adjust')
  @RequirePermissions({ action: 'create', resourceType: 'leave-balance' })
  @ApiOperation({ summary: 'Manually adjust leave balance' })
  adjust(@Req() req: any, @Body() dto: AdjustLeaveBalanceDto) {
    return this.balanceService.adjust(req.user.companyId, dto, req.user.id);
  }
}
