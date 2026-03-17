import {
  Controller,
  Get,
  Post,
  Body,
  Param,
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
import { AttendanceCorrectionService } from '../services/attendance-correction.service';
import {
  CreateCorrectionRequestDto,
  ReviewCorrectionRequestDto,
} from '../dto/create-correction-request.dto';
import { AttendanceCorrectionRequest } from '../entities/attendance-correction-request.entity';
import { PaginatedResponse } from '../../../shared/dto/pagination.dto';
import { PaginationDto } from '../../../shared/dto/pagination.dto';

@ApiTags('Attendance Corrections')
@ApiBearerAuth()
@Controller('time-management/attendance-corrections')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AttendanceCorrectionController {
  constructor(
    private readonly correctionService: AttendanceCorrectionService,
  ) {}

  @Post()
  @RequirePermissions({ action: 'create', resourceType: 'attendance-correction' })
  @ApiOperation({ summary: 'Create a correction request' })
  @ApiResponse({ status: 201, type: AttendanceCorrectionRequest })
  create(
    @Req() req: any,
    @Body() dto: CreateCorrectionRequestDto,
  ): Promise<AttendanceCorrectionRequest> {
    return this.correctionService.create(req.user.companyId, dto);
  }

  @Get()
  @RequirePermissions({ action: 'read', resourceType: 'attendance-correction' })
  @ApiOperation({ summary: 'Get correction requests (paginated)' })
  findAll(
    @Req() req: any,
    @Query() query: PaginationDto & { employeeId?: string; status?: string },
  ): Promise<PaginatedResponse<AttendanceCorrectionRequest>> {
    return this.correctionService.findAll(req.user.companyId, query);
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', resourceType: 'attendance-correction' })
  @ApiOperation({ summary: 'Get a correction request by ID' })
  @ApiResponse({ status: 200, type: AttendanceCorrectionRequest })
  findOne(@Param('id') id: string): Promise<AttendanceCorrectionRequest> {
    return this.correctionService.findOne(id);
  }

  @Post(':id/approve')
  @RequirePermissions({ action: 'update', resourceType: 'attendance-correction' })
  @ApiOperation({ summary: 'Approve a correction request' })
  @ApiResponse({ status: 200, type: AttendanceCorrectionRequest })
  approve(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: ReviewCorrectionRequestDto,
  ): Promise<AttendanceCorrectionRequest> {
    return this.correctionService.approve(id, req.user.id, dto.notes);
  }

  @Post(':id/reject')
  @RequirePermissions({ action: 'update', resourceType: 'attendance-correction' })
  @ApiOperation({ summary: 'Reject a correction request' })
  @ApiResponse({ status: 200, type: AttendanceCorrectionRequest })
  reject(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: ReviewCorrectionRequestDto,
  ): Promise<AttendanceCorrectionRequest> {
    return this.correctionService.reject(id, req.user.id, dto.notes);
  }

  @Post(':id/cancel')
  @RequirePermissions({ action: 'update', resourceType: 'attendance-correction' })
  @ApiOperation({ summary: 'Cancel a correction request' })
  @ApiResponse({ status: 200, type: AttendanceCorrectionRequest })
  cancel(@Param('id') id: string): Promise<AttendanceCorrectionRequest> {
    return this.correctionService.cancel(id);
  }
}
