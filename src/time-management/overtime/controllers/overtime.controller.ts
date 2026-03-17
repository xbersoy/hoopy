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
import { OvertimeService } from '../services/overtime.service';
import {
  CreateOvertimeRequestDto,
  ReviewOvertimeRequestDto,
  QueryOvertimeDto,
} from '../dto/create-overtime.dto';
import { OvertimeRequest } from '../entities/overtime-request.entity';
import { PaginatedResponse } from '../../../shared/dto/pagination.dto';

@ApiTags('Overtime')
@ApiBearerAuth()
@Controller('time-management/overtime')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OvertimeController {
  constructor(private readonly overtimeService: OvertimeService) {}

  @Post()
  @RequirePermissions({ action: 'create', resourceType: 'overtime-request' })
  @ApiOperation({ summary: 'Create an overtime request' })
  @ApiResponse({ status: 201, type: OvertimeRequest })
  create(
    @Req() req: any,
    @Body() dto: CreateOvertimeRequestDto,
  ): Promise<OvertimeRequest> {
    return this.overtimeService.create(req.user.companyId, dto);
  }

  @Get()
  @RequirePermissions({ action: 'read', resourceType: 'overtime-request' })
  @ApiOperation({ summary: 'Get overtime requests (paginated)' })
  findAll(
    @Req() req: any,
    @Query() query: QueryOvertimeDto,
  ): Promise<PaginatedResponse<OvertimeRequest>> {
    return this.overtimeService.findAll(req.user.companyId, query);
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', resourceType: 'overtime-request' })
  @ApiOperation({ summary: 'Get an overtime request by ID' })
  @ApiResponse({ status: 200, type: OvertimeRequest })
  findOne(@Param('id') id: string): Promise<OvertimeRequest> {
    return this.overtimeService.findOne(id);
  }

  @Post(':id/approve')
  @RequirePermissions({ action: 'update', resourceType: 'overtime-request' })
  @ApiOperation({ summary: 'Approve an overtime request' })
  @ApiResponse({ status: 200, type: OvertimeRequest })
  approve(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: ReviewOvertimeRequestDto,
  ): Promise<OvertimeRequest> {
    return this.overtimeService.approve(id, req.user.id, dto);
  }

  @Post(':id/reject')
  @RequirePermissions({ action: 'update', resourceType: 'overtime-request' })
  @ApiOperation({ summary: 'Reject an overtime request' })
  @ApiResponse({ status: 200, type: OvertimeRequest })
  reject(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: ReviewOvertimeRequestDto,
  ): Promise<OvertimeRequest> {
    return this.overtimeService.reject(id, req.user.id, dto.notes);
  }

  @Post(':id/cancel')
  @RequirePermissions({ action: 'update', resourceType: 'overtime-request' })
  @ApiOperation({ summary: 'Cancel an overtime request' })
  @ApiResponse({ status: 200, type: OvertimeRequest })
  cancel(@Param('id') id: string): Promise<OvertimeRequest> {
    return this.overtimeService.cancel(id);
  }

  @Post(':id/complete')
  @RequirePermissions({ action: 'update', resourceType: 'overtime-request' })
  @ApiOperation({ summary: 'Complete an overtime request' })
  @ApiResponse({ status: 200, type: OvertimeRequest })
  complete(
    @Param('id') id: string,
    @Body() body: { actualMinutes: number },
  ): Promise<OvertimeRequest> {
    return this.overtimeService.complete(id, body.actualMinutes);
  }
}
