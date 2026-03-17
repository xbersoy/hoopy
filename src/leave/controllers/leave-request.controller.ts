import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
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
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { PermissionsGuard } from '../../permissions/guards/permissions.guard';
import { RequirePermissions } from '../../permissions/decorators/require-permissions.decorator';
import { LeaveRequestService } from '../services/leave-request.service';
import { CreateLeaveRequestDto } from '../dto/create-leave-request.dto';
import { QueryLeaveRequestDto } from '../dto/query-leave.dto';
import { LeaveRequest } from '../entities/leave-request.entity';
import { PaginatedResponse } from '../../shared/dto';

@ApiTags('Leave Requests')
@ApiBearerAuth()
@Controller('leave-requests')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LeaveRequestController {
  constructor(private readonly leaveRequestService: LeaveRequestService) {}

  @Post()
  @RequirePermissions({ action: 'create', resourceType: 'leave-request' })
  @ApiOperation({ summary: 'Create a leave request' })
  @ApiResponse({ status: 201, type: LeaveRequest })
  create(@Req() req: any, @Body() dto: CreateLeaveRequestDto): Promise<LeaveRequest> {
    return this.leaveRequestService.create(
      req.user.companyId,
      req.user.id,
      dto,
    );
  }

  @Get()
  @RequirePermissions({ action: 'read', resourceType: 'leave-request' })
  @ApiOperation({ summary: 'Get leave requests (paginated)' })
  findAll(
    @Req() req: any,
    @Query() query: QueryLeaveRequestDto,
  ): Promise<PaginatedResponse<LeaveRequest>> {
    return this.leaveRequestService.findPaginated(req.user.companyId, query);
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', resourceType: 'leave-request' })
  @ApiOperation({ summary: 'Get a leave request by ID' })
  @ApiResponse({ status: 200, type: LeaveRequest })
  findOne(@Param('id') id: string): Promise<LeaveRequest> {
    return this.leaveRequestService.findOne(id);
  }

  @Patch(':id/submit')
  @RequirePermissions({ action: 'update', resourceType: 'leave-request' })
  @ApiOperation({ summary: 'Submit a draft leave request' })
  @ApiResponse({ status: 200, type: LeaveRequest })
  submit(@Param('id') id: string, @Req() req: any): Promise<LeaveRequest> {
    return this.leaveRequestService.submit(id, req.user.id);
  }

  @Patch(':id/approve')
  @RequirePermissions({ action: 'update', resourceType: 'leave-request' })
  @ApiOperation({ summary: 'Approve a submitted leave request' })
  @ApiResponse({ status: 200, type: LeaveRequest })
  approve(@Param('id') id: string, @Req() req: any): Promise<LeaveRequest> {
    return this.leaveRequestService.approve(id, req.user.id);
  }

  @Patch(':id/reject')
  @RequirePermissions({ action: 'update', resourceType: 'leave-request' })
  @ApiOperation({ summary: 'Reject a submitted leave request' })
  @ApiResponse({ status: 200, type: LeaveRequest })
  reject(@Param('id') id: string, @Req() req: any): Promise<LeaveRequest> {
    return this.leaveRequestService.reject(id, req.user.id);
  }

  @Patch(':id/cancel')
  @RequirePermissions({ action: 'update', resourceType: 'leave-request' })
  @ApiOperation({ summary: 'Cancel a leave request' })
  @ApiResponse({ status: 200, type: LeaveRequest })
  cancel(@Param('id') id: string, @Req() req: any): Promise<LeaveRequest> {
    return this.leaveRequestService.cancel(id, req.user.id);
  }
}
