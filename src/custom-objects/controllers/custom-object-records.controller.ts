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
import { CustomObjectRecordsService } from '../services/custom-object-records.service';
import { CreateCustomObjectRecordDto } from '../dto/create-custom-object-record.dto';
import { UpdateCustomObjectRecordDto } from '../dto/update-custom-object-record.dto';
import { CustomObjectRecord } from '../entities/custom-object-record.entity';
import { PaginationDto, PaginatedResponse } from '../../shared/dto';

@ApiTags('Custom Object Records')
@ApiBearerAuth()
@Controller('custom-object-records')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CustomObjectRecordsController {
  constructor(private readonly recordsService: CustomObjectRecordsService) {}

  @Post()
  @RequirePermissions({
    action: 'create',
    resourceType: 'custom-object-record',
  })
  @ApiOperation({ summary: 'Create a custom object record' })
  @ApiResponse({ status: 201, description: 'Record created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Body() dto: CreateCustomObjectRecordDto,
    @Req() req,
  ): Promise<CustomObjectRecord> {
    return this.recordsService.create(dto, req.user.companyId, req.user.sub);
  }

  @Get()
  @RequirePermissions({
    action: 'read',
    resourceType: 'custom-object-record',
  })
  @ApiOperation({ summary: 'List records for a custom object definition' })
  @ApiQuery({
    name: 'definitionId',
    required: true,
    description: 'Custom object definition ID',
  })
  @ApiQuery({
    name: 'baseObjectId',
    required: false,
    description: 'Filter by base object ID (e.g., employee ID)',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of records' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query('definitionId') definitionId: string,
    @Query('baseObjectId') baseObjectId: string | undefined,
    @Query() query: PaginationDto,
    @Req() req,
  ): Promise<PaginatedResponse<CustomObjectRecord>> {
    return this.recordsService.findAll(
      definitionId,
      req.user.companyId,
      query,
      req.user.sub,
      baseObjectId,
    );
  }

  @Get(':id')
  @RequirePermissions({
    action: 'read',
    resourceType: 'custom-object-record',
  })
  @ApiOperation({ summary: 'Get a custom object record by ID' })
  @ApiResponse({ status: 200, description: 'Record details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id') id: string, @Req() req): Promise<CustomObjectRecord> {
    return this.recordsService.findOne(id, req.user.sub);
  }

  @Patch(':id')
  @RequirePermissions({
    action: 'update',
    resourceType: 'custom-object-record',
  })
  @ApiOperation({ summary: 'Update a custom object record' })
  @ApiResponse({ status: 200, description: 'Record updated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomObjectRecordDto,
    @Req() req,
  ): Promise<CustomObjectRecord> {
    return this.recordsService.update(id, dto, req.user.sub);
  }

  @Delete(':id')
  @RequirePermissions({
    action: 'delete',
    resourceType: 'custom-object-record',
  })
  @ApiOperation({ summary: 'Delete a custom object record' })
  @ApiResponse({ status: 200, description: 'Record deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(@Param('id') id: string, @Req() req): Promise<CustomObjectRecord> {
    return this.recordsService.remove(id, req.user.sub);
  }

  @Get('export')
  @RequirePermissions({
    action: 'read',
    resourceType: 'custom-object-record',
  })
  @ApiOperation({ summary: 'Export records for a definition (JSON or CSV)' })
  @ApiQuery({ name: 'definitionId', required: true })
  @ApiQuery({ name: 'format', required: false, description: 'json or csv' })
  async exportRecords(
    @Query('definitionId') definitionId: string,
    @Query('format') format: string = 'json',
    @Req() req,
  ) {
    const result = await this.recordsService.findAll(
      definitionId,
      req.user.companyId,
      { page: 1, limit: 10000 },
      req.user.sub,
    );
    if (format === 'csv') {
      const { CsvHelper } = await import('../../shared/utils/csv.helper');
      const rows = result.data.map((r) => ({
        id: r.id,
        baseObjectId: r.baseObjectId ?? '',
        ...r.data,
      }));
      return { format: 'csv', content: CsvHelper.toCsv(rows) };
    }
    return { format: 'json', content: result.data };
  }

  @Post('import')
  @RequirePermissions({
    action: 'create',
    resourceType: 'custom-object-record',
  })
  @ApiOperation({ summary: 'Import records for a definition (JSON or CSV)' })
  async importRecords(
    @Body() body: { definitionId: string; format: string; content: any },
    @Req() req,
  ) {
    let records: any[];
    if (body.format === 'csv') {
      const { CsvHelper } = await import('../../shared/utils/csv.helper');
      const rows = CsvHelper.fromCsv(body.content);
      records = rows.map((row) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { baseObjectId, id: _id, ...data } = row;
        // Convert numeric strings back to numbers where possible
        const parsedData: Record<string, any> = {};
        for (const [key, val] of Object.entries(data)) {
          const num = Number(val);
          parsedData[key] = !isNaN(num) && val !== '' ? num : val;
        }
        return {
          definitionId: body.definitionId,
          baseObjectId: baseObjectId || undefined,
          data: parsedData,
        };
      });
    } else {
      const items = Array.isArray(body.content) ? body.content : [body.content];
      records = items.map((item) => ({
        definitionId: body.definitionId,
        baseObjectId: item.baseObjectId || undefined,
        data: item.data || item,
      }));
    }

    const results: CustomObjectRecord[] = [];
    for (const rec of records) {
      const created = await this.recordsService.create(
        rec,
        req.user.companyId,
        req.user.sub,
      );
      results.push(created);
    }
    return { imported: results.length, records: results };
  }
}
