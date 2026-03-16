import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { PermissionRolesService } from '../services/permission-roles.service';
import { PermissionRole } from '../entities/permission-role.entity';
import {
  CreatePermissionRoleDto,
  UpdatePermissionRoleDto,
} from '../dto/create-permission-role.dto';

@ApiTags('Permission Roles')
@ApiBearerAuth()
@Controller('permission-roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionRolesController {
  constructor(
    private readonly permissionRolesService: PermissionRolesService,
  ) {}

  @Get()
  @RequirePermissions({ action: 'read', resourceType: 'permission-role' })
  @ApiOperation({
    summary: 'List all permission roles for the current company',
  })
  @ApiResponse({
    status: 200,
    description: 'List of permission roles',
    type: [PermissionRole],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(@Req() req): Promise<PermissionRole[]> {
    return this.permissionRolesService.findAllByCompany(req.user.companyId);
  }

  @Get('export')
  @RequirePermissions({ action: 'read', resourceType: 'permission-role' })
  @ApiOperation({ summary: 'Export all permission roles (JSON or CSV)' })
  @ApiQuery({
    name: 'format',
    required: false,
    description: 'json or csv (default: json)',
  })
  async exportPermissionRoles(
    @Query('format') format: string = 'json',
    @Req() req,
  ) {
    const roles = await this.permissionRolesService.findAllByCompany(
      req.user.companyId,
    );
    if (format === 'csv') {
      const { CsvHelper } = await import('../../shared/utils/csv.helper');
      const rows = roles.map((r) => ({
        name: r.name,
        description: r.description,
        permissionIds: JSON.stringify((r.permissions || []).map((p) => p.id)),
      }));
      return { format: 'csv', content: CsvHelper.toCsv(rows) };
    }
    return { format: 'json', content: roles };
  }

  @Post('import')
  @RequirePermissions({ action: 'create', resourceType: 'permission-role' })
  @ApiOperation({ summary: 'Import permission roles (JSON or CSV)' })
  async importPermissionRoles(
    @Body() body: { format: string; content: any },
    @Req() req,
  ) {
    let items: any[];
    if (body.format === 'csv') {
      const { CsvHelper } = await import('../../shared/utils/csv.helper');
      items = CsvHelper.fromCsv(body.content).map((row) => ({
        name: row.name,
        description: row.description,
        permissionIds: row.permissionIds ? JSON.parse(row.permissionIds) : [],
      }));
    } else {
      items = Array.isArray(body.content) ? body.content : [body.content];
    }
    const results = [];
    for (const item of items) {
      const created = await this.permissionRolesService.create(
        {
          name: item.name,
          description: item.description,
          permissionIds: item.permissionIds,
        },
        req.user.companyId,
      );
      results.push(created);
    }
    return { imported: results.length };
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', resourceType: 'permission-role' })
  @ApiOperation({ summary: 'Get a permission role by ID' })
  @ApiResponse({
    status: 200,
    description: 'Permission role details',
    type: PermissionRole,
  })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id') id: string, @Req() req): Promise<PermissionRole> {
    return this.permissionRolesService.findOne(id, req.user.companyId);
  }

  @Post()
  @RequirePermissions({ action: 'create', resourceType: 'permission-role' })
  @ApiOperation({ summary: 'Create a new permission role' })
  @ApiResponse({
    status: 201,
    description: 'Permission role created',
    type: PermissionRole,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(
    @Body() dto: CreatePermissionRoleDto,
    @Req() req,
  ): Promise<PermissionRole> {
    return this.permissionRolesService.create(dto, req.user.companyId);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'update', resourceType: 'permission-role' })
  @ApiOperation({ summary: 'Update a permission role' })
  @ApiResponse({
    status: 200,
    description: 'Permission role updated',
    type: PermissionRole,
  })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePermissionRoleDto,
    @Req() req,
  ): Promise<PermissionRole> {
    return this.permissionRolesService.update(id, dto, req.user.companyId);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'delete', resourceType: 'permission-role' })
  @ApiOperation({ summary: 'Delete a permission role' })
  @ApiResponse({ status: 200, description: 'Permission role deleted' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(@Param('id') id: string, @Req() req): Promise<void> {
    return this.permissionRolesService.remove(id, req.user.companyId);
  }
}
