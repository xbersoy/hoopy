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
import {
  OrgUnitTypeService,
  ResolvedOrgUnitType,
} from '../services/org-unit-type.service';
import { CreateOrgUnitTypeDto } from '../dto/create-org-unit-type.dto';
import { UpdateOrgUnitTypeDto } from '../dto/update-org-unit-type.dto';
import { OrgUnitType } from '../entities/org-unit-type.entity';
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

@ApiTags('Org Unit Types')
@ApiBearerAuth()
@Controller('companies/:companyId/org-unit-types')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrgUnitTypeController {
  constructor(private readonly orgUnitTypeService: OrgUnitTypeService) {}

  @Post()
  @RequirePermissions({ action: 'create', resourceType: 'org-unit-type' })
  @ApiOperation({ summary: 'Create a new org unit type with translations' })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Type created', type: OrgUnitType })
  @ApiResponse({
    status: 400,
    description: 'Bad request (no translations or invalid data)',
  })
  @ApiResponse({
    status: 409,
    description: 'Slug already exists for this company',
  })
  create(
    @Param('companyId') companyId: string,
    @Body() dto: CreateOrgUnitTypeDto,
  ): Promise<OrgUnitType> {
    return this.orgUnitTypeService.create(companyId, dto);
  }

  @Get()
  @RequirePermissions({ action: 'read', resourceType: 'org-unit-type' })
  @ApiOperation({
    summary: 'List all org unit types for a company (with locale resolution)',
  })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid' })
  @ApiQuery({
    name: 'locale',
    required: false,
    description: 'BCP-47 locale (default: en)',
    example: 'tr',
  })
  @ApiQuery({
    name: 'includeTranslations',
    required: false,
    description: 'Include all translations',
    type: Boolean,
  })
  @ApiResponse({
    status: 200,
    description: 'List of types with resolved labels',
  })
  findAll(
    @Param('companyId') companyId: string,
    @Query('locale') locale?: string,
    @Query('includeTranslations') includeTranslations?: string,
  ): Promise<ResolvedOrgUnitType[]> {
    return this.orgUnitTypeService.findAll(
      companyId,
      locale,
      includeTranslations === 'true',
    );
  }

  @Get('export')
  @RequirePermissions({ action: 'read', resourceType: 'org-unit-type' })
  @ApiOperation({ summary: 'Export all org unit types (JSON or CSV)' })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid' })
  @ApiQuery({
    name: 'format',
    required: false,
    description: 'json or csv (default: json)',
  })
  async exportOrgUnitTypes(
    @Param('companyId') companyId: string,
    @Query('format') format: string = 'json',
  ) {
    const types = await this.orgUnitTypeService.findAll(
      companyId,
      undefined,
      true,
    );
    if (format === 'csv') {
      const { CsvHelper } = await import('../../shared/utils/csv.helper');
      const rows = types.map((t) => ({
        slug: t.slug,
        color: t.color,
        icon: t.icon,
        name: t.name,
        translations: JSON.stringify(t.translations),
      }));
      return { format: 'csv', content: CsvHelper.toCsv(rows) };
    }
    return { format: 'json', content: types };
  }

  @Post('import')
  @RequirePermissions({ action: 'create', resourceType: 'org-unit-type' })
  @ApiOperation({ summary: 'Import org unit types (JSON or CSV)' })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid' })
  async importOrgUnitTypes(
    @Param('companyId') companyId: string,
    @Body() body: { format: string; content: any },
  ) {
    let items: any[];
    if (body.format === 'csv') {
      const { CsvHelper } = await import('../../shared/utils/csv.helper');
      items = CsvHelper.fromCsv(body.content).map((row) => ({
        slug: row.slug,
        color: row.color,
        icon: row.icon,
        name: row.name,
        translations: row.translations ? JSON.parse(row.translations) : [],
      }));
    } else {
      items = Array.isArray(body.content) ? body.content : [body.content];
    }
    const results = [];
    for (const item of items) {
      const created = await this.orgUnitTypeService.create(companyId, item);
      results.push(created);
    }
    return { imported: results.length };
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', resourceType: 'org-unit-type' })
  @ApiOperation({
    summary: 'Get a single org unit type with locale resolution',
  })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiQuery({
    name: 'locale',
    required: false,
    description: 'BCP-47 locale (default: en)',
  })
  @ApiQuery({ name: 'includeTranslations', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Type with resolved labels' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Query('locale') locale?: string,
    @Query('includeTranslations') includeTranslations?: string,
  ): Promise<ResolvedOrgUnitType> {
    return this.orgUnitTypeService.findOneResolved(
      id,
      companyId,
      locale,
      includeTranslations === 'true',
    );
  }

  @Patch(':id')
  @RequirePermissions({ action: 'update', resourceType: 'org-unit-type' })
  @ApiOperation({ summary: 'Update an org unit type (upserts translations)' })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Type updated', type: OrgUnitType })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateOrgUnitTypeDto,
  ): Promise<OrgUnitType> {
    return this.orgUnitTypeService.update(id, companyId, dto);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'delete', resourceType: 'org-unit-type' })
  @ApiOperation({ summary: 'Delete an org unit type (cascades translations)' })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Type deleted', type: OrgUnitType })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
  ): Promise<OrgUnitType> {
    return this.orgUnitTypeService.remove(id, companyId);
  }
}
