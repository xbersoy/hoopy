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
import { AttendanceService } from '../services/attendance.service';
import {
  CreateAttendanceRecordDto,
  UpdateAttendanceRecordDto,
  QueryAttendanceDto,
} from '../dto/create-attendance-record.dto';
import { AttendanceRecord } from '../entities/attendance-record.entity';
import { PaginatedResponse } from '../../../shared/dto/pagination.dto';
import { CheckSource } from '../enums/attendance.enums';

@ApiTags('Attendance')
@ApiBearerAuth()
@Controller('time-management/attendance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @RequirePermissions({ action: 'create', resourceType: 'attendance-record' })
  @ApiOperation({ summary: 'Create a manual attendance record' })
  @ApiResponse({ status: 201, type: AttendanceRecord })
  create(
    @Req() req: any,
    @Body() dto: CreateAttendanceRecordDto,
  ): Promise<AttendanceRecord> {
    return this.attendanceService.createManual(req.user.companyId, dto);
  }

  @Post('check-in')
  @RequirePermissions({ action: 'create', resourceType: 'attendance-record' })
  @ApiOperation({ summary: 'Check in for today' })
  @ApiResponse({ status: 201, type: AttendanceRecord })
  checkIn(
    @Req() req: any,
    @Body() dto: { source?: CheckSource; notes?: string },
  ): Promise<AttendanceRecord> {
    return this.attendanceService.checkIn(req.user.companyId, req.user.id, dto);
  }

  @Post('check-out')
  @RequirePermissions({ action: 'create', resourceType: 'attendance-record' })
  @ApiOperation({ summary: 'Check out for today' })
  @ApiResponse({ status: 201, type: AttendanceRecord })
  checkOut(
    @Req() req: any,
    @Body() dto: { source?: CheckSource; notes?: string },
  ): Promise<AttendanceRecord> {
    return this.attendanceService.checkOut(
      req.user.companyId,
      req.user.id,
      dto,
    );
  }

  @Get()
  @RequirePermissions({ action: 'read', resourceType: 'attendance-record' })
  @ApiOperation({ summary: 'Get attendance records (paginated)' })
  findAll(
    @Req() req: any,
    @Query() query: QueryAttendanceDto,
  ): Promise<PaginatedResponse<AttendanceRecord>> {
    return this.attendanceService.findAll(req.user.companyId, query);
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', resourceType: 'attendance-record' })
  @ApiOperation({ summary: 'Get an attendance record by ID' })
  @ApiResponse({ status: 200, type: AttendanceRecord })
  findOne(@Param('id') id: string): Promise<AttendanceRecord> {
    return this.attendanceService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'update', resourceType: 'attendance-record' })
  @ApiOperation({ summary: 'Update an attendance record' })
  @ApiResponse({ status: 200, type: AttendanceRecord })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAttendanceRecordDto,
  ): Promise<AttendanceRecord> {
    return this.attendanceService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'delete', resourceType: 'attendance-record' })
  @ApiOperation({ summary: 'Delete an attendance record' })
  @ApiResponse({ status: 200, type: AttendanceRecord })
  remove(@Param('id') id: string): Promise<AttendanceRecord> {
    return this.attendanceService.remove(id);
  }
}
