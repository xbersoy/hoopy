import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { PermissionsGuard } from '../../permissions/guards/permissions.guard';
import { RequirePermissions } from '../../permissions/decorators/require-permissions.decorator';
import { CustomObjectDefinitionsService } from '../services/custom-object-definitions.service';
import { CreateCustomObjectDefinitionDto } from '../dto/create-custom-object-definition.dto';
import { UpdateCustomObjectDefinitionDto } from '../dto/update-custom-object-definition.dto';
import { QueryCustomObjectDefinitionDto } from '../dto/query-custom-object-definition.dto';
import { CustomObjectDefinition } from '../entities/custom-object-definition.entity';
import { PaginatedResponse } from '../../shared/dto';

@ApiTags('Custom Object Definitions')
@ApiBearerAuth()
@Controller('custom-object-definitions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CustomObjectDefinitionsController {
  constructor(
    private readonly definitionsService: CustomObjectDefinitionsService,
  ) { }

  @Post()
  @RequirePermissions({
    action: 'create',
    resourceType: 'custom-object-definition',
  })
  @ApiOperation({ summary: 'Create a custom object definition' })
  @ApiResponse({ status: 201, description: 'Definition created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Body() dto: CreateCustomObjectDefinitionDto,
    @Req() req,
  ): Promise<CustomObjectDefinition> {
    return this.definitionsService.create(
      dto,
      req.user.companyId,
      req.user.sub,
    );
  }

  @Get()
  @RequirePermissions({
    action: 'read',
    resourceType: 'custom-object-definition',
  })
  @ApiOperation({ summary: 'List custom object definitions (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query() query: QueryCustomObjectDefinitionDto,
    @Req() req,
  ): Promise<PaginatedResponse<CustomObjectDefinition>> {
    return this.definitionsService.findAll(req.user.companyId, query);
  }

  @Get(':id')
  @RequirePermissions({
    action: 'read',
    resourceType: 'custom-object-definition',
  })
  @ApiOperation({ summary: 'Get a custom object definition by ID' })
  @ApiResponse({ status: 200, description: 'Definition details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id') id: string): Promise<CustomObjectDefinition> {
    return this.definitionsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions({
    action: 'update',
    resourceType: 'custom-object-definition',
  })
  @ApiOperation({ summary: 'Update a custom object definition' })
  @ApiResponse({ status: 200, description: 'Definition updated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomObjectDefinitionDto,
    @Req() req,
  ): Promise<CustomObjectDefinition> {
    return this.definitionsService.update(id, dto, req.user.sub, req.user.companyId);
  }

  @Delete(':id')
  @RequirePermissions({
    action: 'delete',
    resourceType: 'custom-object-definition',
  })
  @ApiOperation({ summary: 'Delete a custom object definition' })
  @ApiResponse({ status: 200, description: 'Definition deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(@Param('id') id: string, @Req() req): Promise<CustomObjectDefinition> {
    return this.definitionsService.remove(id, req.user.companyId);
  }

  @Get('export')
  @RequirePermissions({
    action: 'read',
    resourceType: 'custom-object-definition',
  })
  @ApiOperation({ summary: 'Export all custom object definitions (with translations)' })
  @ApiQuery({ name: 'format', required: false, description: 'json or csv (default: json)' })
  async exportDefinitions(
    @Query('format') format: string = 'json',
    @Req() req,
  ) {
    const { data } = await this.definitionsService.findAll(req.user.companyId, { page: 1, limit: 1000 });
    if (format === 'csv') {
      const { CsvHelper } = await import('../../shared/utils/csv.helper');
      const rows = data.map((d) => ({
        code: d.code,
        label: d.label,
        description: d.description ?? '',
        baseObjectType: d.baseObjectType ?? '',
        isActive: String(d.isActive),
        translations: JSON.stringify(d.translations ?? {}),
        fields: JSON.stringify(d.fields ?? []),
      }));
      return { format: 'csv', content: CsvHelper.toCsv(rows) };
    }
    return { format: 'json', content: data };
  }

  @Post('import')
  @RequirePermissions({
    action: 'create',
    resourceType: 'custom-object-definition',
  })
  @ApiOperation({ summary: 'Import custom object definitions (JSON or CSV)' })
  async importDefinitions(
    @Body() body: { format: string; content: any },
    @Req() req,
  ) {
    let definitions: any[];
    if (body.format === 'csv') {
      const { CsvHelper } = await import('../../shared/utils/csv.helper');
      const rows = CsvHelper.fromCsv(body.content);
      definitions = rows.map((row) => ({
        code: row.code,
        label: row.label,
        description: row.description || undefined,
        baseObjectType: row.baseObjectType || undefined,
        isActive: row.isActive === 'true',
        translations: row.translations ? JSON.parse(row.translations) : undefined,
        fields: row.fields ? JSON.parse(row.fields) : undefined,
      }));
    } else {
      definitions = Array.isArray(body.content) ? body.content : [body.content];
    }

    const results: CustomObjectDefinition[] = [];
    for (const def of definitions) {
      const created = await this.definitionsService.create(def, req.user.companyId, req.user.sub);
      results.push(created);
    }
    return { imported: results.length, definitions: results };
  }
}
