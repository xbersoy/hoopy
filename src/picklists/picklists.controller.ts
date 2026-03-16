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
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { PermissionsGuard } from '../permissions/guards/permissions.guard';
import { RequirePermissions } from '../permissions/decorators/require-permissions.decorator';
import { PicklistsService } from './picklists.service';
import { CreatePicklistDto } from './dto/create-picklist.dto';
import { UpdatePicklistDto } from './dto/update-picklist.dto';
import { CreatePicklistOptionDto } from './dto/create-picklist-option.dto';
import { UpdatePicklistOptionDto } from './dto/update-picklist-option.dto';

@ApiTags('picklists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('picklists')
export class PicklistsController {
  constructor(private readonly picklistsService: PicklistsService) {}

  @Post()
  @RequirePermissions({ action: 'create', resourceType: 'picklist' })
  @ApiOperation({ summary: 'Create a new picklist' })
  create(@Req() req, @Body() dto: CreatePicklistDto) {
    return this.picklistsService.create(req.user.companyId, dto);
  }

  @Get()
  @RequirePermissions({ action: 'read', resourceType: 'picklist' })
  @ApiOperation({ summary: 'Find all picklists (with localized resolution)' })
  @ApiQuery({
    name: 'lang',
    required: false,
    description: 'Locale fallback (e.g. en, tr)',
  })
  @ApiQuery({
    name: 'includeTranslations',
    required: false,
    description: 'Include all translations',
    type: Boolean,
  })
  findAll(
    @Req() req,
    @Query('lang') lang?: string,
    @Query('includeTranslations') includeTranslations?: string,
  ) {
    return this.picklistsService.findAll(
      req.user.companyId,
      lang,
      includeTranslations === 'true',
    );
  }

  @Get('export')
  @RequirePermissions({ action: 'read', resourceType: 'picklist' })
  @ApiOperation({
    summary: 'Export all picklists with translations (JSON or CSV)',
  })
  @ApiQuery({
    name: 'format',
    required: false,
    description: 'json or csv (default: json)',
  })
  async exportPicklists(@Query('format') format: string = 'json', @Req() req) {
    const picklists = await this.picklistsService.findAllRaw(
      req.user.companyId,
    );
    if (format === 'csv') {
      const { CsvHelper } = await import('../shared/utils/csv.helper');
      const rows = picklists.map((p) => ({
        code: p.code,
        isActive: String(p.isActive),
        translations: JSON.stringify(
          (p.translations || []).reduce((acc: any, t: any) => {
            acc[t.locale] = { name: t.name };
            return acc;
          }, {}),
        ),
        options: JSON.stringify(
          (p.options || []).map((opt: any) => ({
            code: opt.code,
            sortOrder: opt.sortOrder,
            isActive: opt.isActive,
            translations: (opt.translations || []).reduce(
              (acc: any, t: any) => {
                acc[t.locale] = { label: t.label };
                return acc;
              },
              {},
            ),
          })),
        ),
      }));
      return { format: 'csv', content: CsvHelper.toCsv(rows) };
    }
    return { format: 'json', content: picklists };
  }

  @Post('import')
  @RequirePermissions({ action: 'create', resourceType: 'picklist' })
  @ApiOperation({ summary: 'Import picklists with translations (JSON or CSV)' })
  async importPicklists(
    @Body() body: { format: string; content: any },
    @Req() req,
  ) {
    let picklists: any[];
    if (body.format === 'csv') {
      const { CsvHelper } = await import('../shared/utils/csv.helper');
      const rows = CsvHelper.fromCsv(body.content);
      picklists = rows.map((row) => ({
        code: row.code,
        isActive: row.isActive === 'true',
        translations: row.translations ? JSON.parse(row.translations) : {},
        options: row.options ? JSON.parse(row.options) : [],
      }));
    } else {
      picklists = Array.isArray(body.content) ? body.content : [body.content];
    }

    const results = [];
    for (const pl of picklists) {
      const { options, ...picklistData } = pl;
      const created = await this.picklistsService.create(
        req.user.companyId,
        picklistData,
      );
      if (options?.length) {
        for (const opt of options) {
          await this.picklistsService.createOption(
            req.user.companyId,
            created.id,
            opt,
          );
        }
      }
      results.push(
        await this.picklistsService.findOne(created.id, req.user.companyId),
      );
    }
    return { imported: results.length, picklists: results };
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', resourceType: 'picklist' })
  @ApiOperation({ summary: 'Find one picklist (with localized resolution)' })
  @ApiQuery({ name: 'lang', required: false })
  @ApiQuery({
    name: 'includeTranslations',
    required: false,
    description: 'Include all translations',
    type: Boolean,
  })
  findOne(
    @Req() req,
    @Param('id') id: string,
    @Query('lang') lang?: string,
    @Query('includeTranslations') includeTranslations?: string,
  ) {
    return this.picklistsService.findOneResolved(
      id,
      req.user.companyId,
      lang,
      includeTranslations === 'true',
    );
  }

  @Patch(':id')
  @RequirePermissions({ action: 'update', resourceType: 'picklist' })
  @ApiOperation({ summary: 'Update a picklist' })
  update(@Req() req, @Param('id') id: string, @Body() dto: UpdatePicklistDto) {
    return this.picklistsService.update(id, req.user.companyId, dto);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'delete', resourceType: 'picklist' })
  @ApiOperation({ summary: 'Delete a picklist' })
  remove(@Req() req, @Param('id') id: string) {
    return this.picklistsService.remove(id, req.user.companyId);
  }

  @Post(':id/options')
  @RequirePermissions({ action: 'create', resourceType: 'picklist' })
  @ApiOperation({ summary: 'Create a new picklist option' })
  createOption(
    @Req() req,
    @Param('id') picklistId: string,
    @Body() dto: CreatePicklistOptionDto,
  ) {
    return this.picklistsService.createOption(
      req.user.companyId,
      picklistId,
      dto,
    );
  }

  @Patch('options/:optionId')
  @RequirePermissions({ action: 'update', resourceType: 'picklist' })
  @ApiOperation({ summary: 'Update a picklist option' })
  updateOption(
    @Req() req,
    @Param('optionId') optionId: string,
    @Body() dto: UpdatePicklistOptionDto,
  ) {
    return this.picklistsService.updateOption(
      optionId,
      req.user.companyId,
      dto,
    );
  }

  @Delete('options/:optionId')
  @RequirePermissions({ action: 'delete', resourceType: 'picklist' })
  @ApiOperation({ summary: 'Delete a picklist option' })
  removeOption(@Req() req, @Param('optionId') optionId: string) {
    return this.picklistsService.removeOption(optionId, req.user.companyId);
  }
}
