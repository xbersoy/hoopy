import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
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
import { EmployeeScheduleService } from '../services/employee-schedule.service';
import {
  CreateEmployeeScheduleDto,
  UpdateEmployeeScheduleDto,
  QueryEmployeeScheduleDto,
} from '../dto/create-employee-schedule.dto';
import { EmployeeSchedule } from '../entities/employee-schedule.entity';
import { PaginatedResponse } from '../../../shared/dto/pagination.dto';

@ApiTags('Employee Schedules')
@ApiBearerAuth()
@Controller('time-management/employee-schedules')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EmployeeScheduleController {
  constructor(private readonly service: EmployeeScheduleService) {}

  @Post()
  @RequirePermissions({ action: 'create', resourceType: 'employee-schedule' })
  @ApiOperation({ summary: 'Assign a schedule to an employee' })
  @ApiResponse({ status: 201, type: EmployeeSchedule })
  create(
    @Req() req: any,
    @Body() dto: CreateEmployeeScheduleDto,
  ): Promise<EmployeeSchedule> {
    return this.service.create(req.user.companyId, dto);
  }

  @Get()
  @RequirePermissions({ action: 'read', resourceType: 'employee-schedule' })
  @ApiOperation({ summary: 'Get employee schedules (paginated)' })
  findAll(
    @Req() req: any,
    @Query() query: QueryEmployeeScheduleDto,
  ): Promise<PaginatedResponse<EmployeeSchedule>> {
    return this.service.findAll(req.user.companyId, query);
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', resourceType: 'employee-schedule' })
  @ApiOperation({ summary: 'Get an employee schedule by ID' })
  @ApiResponse({ status: 200, type: EmployeeSchedule })
  findOne(@Param('id') id: string): Promise<EmployeeSchedule> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'update', resourceType: 'employee-schedule' })
  @ApiOperation({ summary: 'Update an employee schedule' })
  @ApiResponse({ status: 200, type: EmployeeSchedule })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeScheduleDto,
  ): Promise<EmployeeSchedule> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'delete', resourceType: 'employee-schedule' })
  @ApiOperation({ summary: 'Delete an employee schedule' })
  @ApiResponse({ status: 200, type: EmployeeSchedule })
  remove(@Param('id') id: string): Promise<EmployeeSchedule> {
    return this.service.remove(id);
  }
}
