import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { OrgUnitService } from '../services/org-unit.service';
import { CreateOrgUnitDto } from '../dto/create-org-unit.dto';
import { UpdateOrgUnitDto } from '../dto/update-org-unit.dto';
import { MoveOrgUnitDto } from '../dto/move-org-unit.dto';
import { OrgUnit } from '../entities/org-unit.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { PermissionsGuard } from '../../permissions/guards/permissions.guard';
import { RequirePermissions } from '../../permissions/decorators/require-permissions.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Org Units')
@ApiBearerAuth()
@Controller('companies/:companyId/org-units')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrgUnitController {
  constructor(private readonly orgUnitService: OrgUnitService) {}

  @Post()
  @RequirePermissions({ action: 'create', resourceType: 'org-unit' })
  @ApiOperation({ summary: 'Create a new org unit' })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Org unit created', type: OrgUnit })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Parent not found' })
  create(
    @Param('companyId') companyId: string,
    @Body() dto: CreateOrgUnitDto,
  ): Promise<OrgUnit> {
    return this.orgUnitService.create(companyId, dto);
  }

  @Get()
  @RequirePermissions({ action: 'read', resourceType: 'org-unit' })
  @ApiOperation({
    summary: 'List org units (children of parentId, or roots if omitted)',
  })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid' })
  @ApiQuery({
    name: 'parentId',
    required: false,
    description: 'Parent ID; omit for root nodes',
  })
  @ApiResponse({
    status: 200,
    description: 'List of org units',
    type: [OrgUnit],
  })
  findChildren(
    @Param('companyId') companyId: string,
    @Query('parentId') parentId?: string,
  ): Promise<OrgUnit[]> {
    return this.orgUnitService.findChildren(companyId, parentId);
  }

  @Get('all')
  @RequirePermissions({ action: 'read', resourceType: 'org-unit' })
  @ApiOperation({
    summary: 'List all org units in a company (flat, for tree building)',
  })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'All org units (flat list)',
    type: [OrgUnit],
  })
  findAll(@Param('companyId') companyId: string): Promise<OrgUnit[]> {
    return this.orgUnitService.findAll(companyId);
  }

  @Get('export')
  @RequirePermissions({ action: 'read', resourceType: 'org-unit' })
  @ApiOperation({ summary: 'Export all org units (JSON or CSV)' })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid' })
  @ApiQuery({
    name: 'format',
    required: false,
    description: 'json or csv (default: json)',
  })
  async exportOrgUnits(
    @Param('companyId') companyId: string,
    @Query('format') format: string = 'json',
  ) {
    const units = await this.orgUnitService.findAll(companyId);
    if (format === 'csv') {
      const { CsvHelper } = await import('../../shared/utils/csv.helper');
      const rows = units.map((u) => ({
        name: u.name,
        code: u.code,
        status: u.status,
        depth: u.depth,
        parentId: u.parentId,
        typeId: u.typeId,
        description: u.description,
      }));
      return { format: 'csv', content: CsvHelper.toCsv(rows) };
    }
    return { format: 'json', content: units };
  }

  @Post('import')
  @RequirePermissions({ action: 'create', resourceType: 'org-unit' })
  @ApiOperation({ summary: 'Import org units (JSON or CSV)' })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid' })
  async importOrgUnits(
    @Param('companyId') companyId: string,
    @Body() body: { format: string; content: any },
  ) {
    let items: any[];
    if (body.format === 'csv') {
      const { CsvHelper } = await import('../../shared/utils/csv.helper');
      items = CsvHelper.fromCsv(body.content).map((row) => ({
        name: row.name,
        code: row.code,
        status: row.status,
        depth: row.depth,
        parentId: row.parentId,
        typeId: row.typeId,
        description: row.description,
      }));
    } else {
      items = Array.isArray(body.content) ? body.content : [body.content];
    }
    const results = [];
    for (const item of items) {
      const created = await this.orgUnitService.create(companyId, item);
      results.push(created);
    }
    return { imported: results.length };
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', resourceType: 'org-unit' })
  @ApiOperation({ summary: 'Get a single org unit' })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Org unit details', type: OrgUnit })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
  ): Promise<OrgUnit> {
    return this.orgUnitService.findOne(id, companyId);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'update', resourceType: 'org-unit' })
  @ApiOperation({ summary: 'Update an org unit' })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Org unit updated', type: OrgUnit })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateOrgUnitDto,
  ): Promise<OrgUnit> {
    return this.orgUnitService.update(id, companyId, dto);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'delete', resourceType: 'org-unit' })
  @ApiOperation({ summary: 'Soft-delete an org unit (set status to INACTIVE)' })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Org unit deactivated',
    type: OrgUnit,
  })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
  ): Promise<OrgUnit> {
    return this.orgUnitService.remove(id, companyId);
  }

  @Get(':id/subtree')
  @RequirePermissions({ action: 'read', resourceType: 'org-unit' })
  @ApiOperation({ summary: 'Get the full subtree of an org unit' })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Subtree nodes', type: [OrgUnit] })
  @ApiResponse({ status: 404, description: 'Not found' })
  getSubtree(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
  ): Promise<OrgUnit[]> {
    return this.orgUnitService.getSubtree(id, companyId);
  }

  @Get(':id/ancestors')
  @RequirePermissions({ action: 'read', resourceType: 'org-unit' })
  @ApiOperation({ summary: 'Get ancestors of an org unit (root → parent)' })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Ancestor nodes', type: [OrgUnit] })
  @ApiResponse({ status: 404, description: 'Not found' })
  getAncestors(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
  ): Promise<OrgUnit[]> {
    return this.orgUnitService.getAncestors(id, companyId);
  }

  @Post(':id/move')
  @RequirePermissions({ action: 'update', resourceType: 'org-unit' })
  @ApiOperation({ summary: 'Move an org unit to a new parent (or to root)' })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Org unit moved', type: OrgUnit })
  @ApiResponse({ status: 400, description: 'Cycle detected or cross-company' })
  @ApiResponse({ status: 404, description: 'Not found' })
  move(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: MoveOrgUnitDto,
  ): Promise<OrgUnit> {
    return this.orgUnitService.move(id, companyId, dto);
  }
}
