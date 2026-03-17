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
import { LeaveTypeService } from '../services/leave-type.service';
import { CreateLeaveTypeDto, UpdateLeaveTypeDto } from '../dto/create-leave-type.dto';
import { LeaveType } from '../entities/leave-type.entity';

@ApiTags('Leave Types')
@ApiBearerAuth()
@Controller('leave-types')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LeaveTypeController {
  constructor(private readonly leaveTypeService: LeaveTypeService) {}

  @Post()
  @RequirePermissions({ action: 'create', resourceType: 'leave-type' })
  @ApiOperation({ summary: 'Create a new leave type' })
  @ApiResponse({ status: 201, type: LeaveType })
  create(@Req() req: any, @Body() dto: CreateLeaveTypeDto): Promise<LeaveType> {
    return this.leaveTypeService.create(req.user.companyId, dto);
  }

  @Get()
  @RequirePermissions({ action: 'read', resourceType: 'leave-type' })
  @ApiOperation({ summary: 'Get all leave types for company' })
  @ApiResponse({ status: 200, type: [LeaveType] })
  findAll(@Req() req: any): Promise<LeaveType[]> {
    return this.leaveTypeService.findAll(req.user.companyId);
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', resourceType: 'leave-type' })
  @ApiOperation({ summary: 'Get a leave type by ID' })
  @ApiResponse({ status: 200, type: LeaveType })
  findOne(@Param('id') id: string): Promise<LeaveType> {
    return this.leaveTypeService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'update', resourceType: 'leave-type' })
  @ApiOperation({ summary: 'Update a leave type' })
  @ApiResponse({ status: 200, type: LeaveType })
  update(@Param('id') id: string, @Body() dto: UpdateLeaveTypeDto): Promise<LeaveType> {
    return this.leaveTypeService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'delete', resourceType: 'leave-type' })
  @ApiOperation({ summary: 'Delete a leave type' })
  @ApiResponse({ status: 200, type: LeaveType })
  remove(@Param('id') id: string): Promise<LeaveType> {
    return this.leaveTypeService.remove(id);
  }
}
