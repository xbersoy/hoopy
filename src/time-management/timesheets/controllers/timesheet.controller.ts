import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt.guard';
import { PermissionsGuard } from '../../../permissions/guards/permissions.guard';
import { RequirePermissions } from '../../../permissions/decorators/require-permissions.decorator';
import { TimesheetService } from '../services/timesheet.service';
import {
  CreateTimesheetPeriodDto,
  CreateTimesheetEntryDto,
  QueryTimesheetDto,
} from '../dto/create-timesheet.dto';
import { TimesheetPeriod } from '../entities/timesheet-period.entity';
import { PaginatedResponse } from '../../../shared/dto/pagination.dto';

@ApiTags('Timesheets')
@ApiBearerAuth()
@Controller('time-management/timesheets')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TimesheetController {
  constructor(private readonly timesheetService: TimesheetService) {}

  @Post()
  @RequirePermissions({ action: 'create', resourceType: 'timesheet' })
  @ApiOperation({ summary: 'Create a timesheet period' })
  @ApiResponse({ status: 201, type: TimesheetPeriod })
  create(
    @Req() req: any,
    @Body() dto: CreateTimesheetPeriodDto,
  ): Promise<TimesheetPeriod> {
    return this.timesheetService.create(req.user.companyId, dto);
  }

  @Get()
  @RequirePermissions({ action: 'read', resourceType: 'timesheet' })
  @ApiOperation({ summary: 'Get timesheet periods (paginated)' })
  findAll(
    @Req() req: any,
    @Query() query: QueryTimesheetDto,
  ): Promise<PaginatedResponse<TimesheetPeriod>> {
    return this.timesheetService.findAll(req.user.companyId, query);
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', resourceType: 'timesheet' })
  @ApiOperation({ summary: 'Get a timesheet period by ID' })
  @ApiResponse({ status: 200, type: TimesheetPeriod })
  findOne(@Param('id') id: string): Promise<TimesheetPeriod> {
    return this.timesheetService.findOne(id);
  }

  @Post(':id/entries')
  @RequirePermissions({ action: 'update', resourceType: 'timesheet' })
  @ApiOperation({ summary: 'Add entries to a timesheet period' })
  @ApiResponse({ status: 200, type: TimesheetPeriod })
  addEntries(
    @Param('id') id: string,
    @Body() entries: CreateTimesheetEntryDto[],
  ): Promise<TimesheetPeriod> {
    return this.timesheetService.addEntries(id, entries);
  }

  @Post(':id/submit')
  @RequirePermissions({ action: 'update', resourceType: 'timesheet' })
  @ApiOperation({ summary: 'Submit a timesheet period' })
  @ApiResponse({ status: 200, type: TimesheetPeriod })
  submit(@Param('id') id: string): Promise<TimesheetPeriod> {
    return this.timesheetService.submit(id);
  }

  @Post(':id/approve')
  @RequirePermissions({ action: 'update', resourceType: 'timesheet' })
  @ApiOperation({ summary: 'Approve a timesheet period' })
  @ApiResponse({ status: 200, type: TimesheetPeriod })
  approve(@Param('id') id: string, @Req() req: any): Promise<TimesheetPeriod> {
    return this.timesheetService.approve(id, req.user.id);
  }

  @Post(':id/reject')
  @RequirePermissions({ action: 'update', resourceType: 'timesheet' })
  @ApiOperation({ summary: 'Reject a timesheet period' })
  @ApiResponse({ status: 200, type: TimesheetPeriod })
  reject(
    @Param('id') id: string,
    @Body() body: { reason: string },
  ): Promise<TimesheetPeriod> {
    return this.timesheetService.reject(id, body.reason);
  }

  @Post(':id/lock')
  @RequirePermissions({ action: 'update', resourceType: 'timesheet' })
  @ApiOperation({ summary: 'Lock a timesheet period' })
  @ApiResponse({ status: 200, type: TimesheetPeriod })
  lock(@Param('id') id: string): Promise<TimesheetPeriod> {
    return this.timesheetService.lock(id);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'delete', resourceType: 'timesheet' })
  @ApiOperation({ summary: 'Delete a timesheet period (only DRAFT)' })
  @ApiResponse({ status: 200, type: TimesheetPeriod })
  remove(@Param('id') id: string): Promise<TimesheetPeriod> {
    return this.timesheetService.remove(id);
  }
}
