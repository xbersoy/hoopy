import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { PermissionGroupsService } from '../services/permission-groups.service';
import { PermissionGroup } from '../entities/permission-group.entity';
import {
  CreatePermissionGroupDto,
  UpdatePermissionGroupDto,
} from '../dto/create-permission-group.dto';

@ApiTags('Permission Groups')
@ApiBearerAuth()
@Controller('permission-groups')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionGroupsController {
  constructor(
    private readonly permissionGroupsService: PermissionGroupsService,
  ) {}

  @Get()
  @RequirePermissions({ action: 'read', resourceType: 'permission-group' })
  @ApiOperation({
    summary: 'List all permission groups for the current company',
  })
  @ApiResponse({
    status: 200,
    description: 'List of permission groups',
    type: [PermissionGroup],
  })
  findAll(@Req() req): Promise<PermissionGroup[]> {
    return this.permissionGroupsService.findAllByCompany(req.user.companyId);
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', resourceType: 'permission-group' })
  @ApiOperation({ summary: 'Get a permission group by ID' })
  @ApiResponse({
    status: 200,
    description: 'Permission group details',
    type: PermissionGroup,
  })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id') id: string, @Req() req): Promise<PermissionGroup> {
    return this.permissionGroupsService.findOne(id, req.user.companyId);
  }

  @Post()
  @RequirePermissions({ action: 'create', resourceType: 'permission-group' })
  @ApiOperation({ summary: 'Create a new permission group' })
  @ApiResponse({
    status: 201,
    description: 'Permission group created',
    type: PermissionGroup,
  })
  create(
    @Body() dto: CreatePermissionGroupDto,
    @Req() req,
  ): Promise<PermissionGroup> {
    return this.permissionGroupsService.create(dto, req.user.companyId);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'update', resourceType: 'permission-group' })
  @ApiOperation({ summary: 'Update a permission group' })
  @ApiResponse({
    status: 200,
    description: 'Permission group updated',
    type: PermissionGroup,
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePermissionGroupDto,
    @Req() req,
  ): Promise<PermissionGroup> {
    return this.permissionGroupsService.update(id, dto, req.user.companyId);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'delete', resourceType: 'permission-group' })
  @ApiOperation({ summary: 'Delete a permission group' })
  @ApiResponse({ status: 200, description: 'Permission group deleted' })
  remove(@Param('id') id: string, @Req() req): Promise<void> {
    return this.permissionGroupsService.remove(id, req.user.companyId);
  }

  @Post(':id/members/:userId')
  @RequirePermissions({ action: 'update', resourceType: 'permission-group' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Add a member to a permission group' })
  @ApiResponse({ status: 204, description: 'Member added' })
  addMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Req() req,
  ): Promise<void> {
    return this.permissionGroupsService.addMember(
      id,
      userId,
      req.user.companyId,
    );
  }

  @Delete(':id/members/:userId')
  @RequirePermissions({ action: 'update', resourceType: 'permission-group' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from a permission group' })
  @ApiResponse({ status: 204, description: 'Member removed' })
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Req() req,
  ): Promise<void> {
    return this.permissionGroupsService.removeMember(
      id,
      userId,
      req.user.companyId,
    );
  }

  @Post(':id/roles/:roleId')
  @RequirePermissions({ action: 'update', resourceType: 'permission-group' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Add a role to a permission group' })
  @ApiResponse({ status: 204, description: 'Role added' })
  addRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @Req() req,
  ): Promise<void> {
    return this.permissionGroupsService.addRole(id, roleId, req.user.companyId);
  }

  @Delete(':id/roles/:roleId')
  @RequirePermissions({ action: 'update', resourceType: 'permission-group' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a role from a permission group' })
  @ApiResponse({ status: 204, description: 'Role removed' })
  removeRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @Req() req,
  ): Promise<void> {
    return this.permissionGroupsService.removeRole(
      id,
      roleId,
      req.user.companyId,
    );
  }
}
