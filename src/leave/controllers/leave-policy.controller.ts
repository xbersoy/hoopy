import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
import { LeavePolicyService } from '../services/leave-policy.service';
import {
  CreateLeavePolicyDto,
  UpdateLeavePolicyDto,
} from '../dto/create-leave-policy.dto';
import { LeavePolicy } from '../entities/leave-policy.entity';

@ApiTags('Leave Policies')
@ApiBearerAuth()
@Controller('leave-policies')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LeavePolicyController {
  constructor(private readonly leavePolicyService: LeavePolicyService) {}

  @Post()
  @RequirePermissions({ action: 'create', resourceType: 'leave-policy' })
  @ApiOperation({ summary: 'Create a leave policy with entitlement rules' })
  @ApiResponse({ status: 201, type: LeavePolicy })
  create(
    @Req() req: any,
    @Body() dto: CreateLeavePolicyDto,
  ): Promise<LeavePolicy> {
    return this.leavePolicyService.create(req.user.companyId, dto);
  }

  @Get()
  @RequirePermissions({ action: 'read', resourceType: 'leave-policy' })
  @ApiOperation({ summary: 'Get all leave policies for company' })
  @ApiResponse({ status: 200, type: [LeavePolicy] })
  findAll(@Req() req: any): Promise<LeavePolicy[]> {
    return this.leavePolicyService.findAll(req.user.companyId);
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', resourceType: 'leave-policy' })
  @ApiOperation({ summary: 'Get a leave policy by ID' })
  @ApiResponse({ status: 200, type: LeavePolicy })
  findOne(@Param('id') id: string): Promise<LeavePolicy> {
    return this.leavePolicyService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'update', resourceType: 'leave-policy' })
  @ApiOperation({ summary: 'Update a leave policy' })
  @ApiResponse({ status: 200, type: LeavePolicy })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLeavePolicyDto,
  ): Promise<LeavePolicy> {
    return this.leavePolicyService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'delete', resourceType: 'leave-policy' })
  @ApiOperation({ summary: 'Delete a leave policy' })
  @ApiResponse({ status: 200, type: LeavePolicy })
  remove(@Param('id') id: string): Promise<LeavePolicy> {
    return this.leavePolicyService.remove(id);
  }
}
