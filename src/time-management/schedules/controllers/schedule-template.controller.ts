import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt.guard';
import { PermissionsGuard } from '../../../permissions/guards/permissions.guard';
import { RequirePermissions } from '../../../permissions/decorators/require-permissions.decorator';
import { ScheduleTemplateService } from '../services/schedule-template.service';
import {
  CreateScheduleTemplateDto,
  UpdateScheduleTemplateDto,
} from '../dto/create-schedule-template.dto';
import { ScheduleTemplate } from '../entities/schedule-template.entity';

@ApiTags('Schedule Templates')
@ApiBearerAuth()
@Controller('time-management/schedule-templates')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ScheduleTemplateController {
  constructor(private readonly service: ScheduleTemplateService) {}

  @Post()
  @RequirePermissions({ action: 'create', resourceType: 'schedule-template' })
  @ApiOperation({ summary: 'Create a schedule template' })
  @ApiResponse({ status: 201, type: ScheduleTemplate })
  create(
    @Req() req: any,
    @Body() dto: CreateScheduleTemplateDto,
  ): Promise<ScheduleTemplate> {
    return this.service.create(req.user.companyId, dto);
  }

  @Get()
  @RequirePermissions({ action: 'read', resourceType: 'schedule-template' })
  @ApiOperation({ summary: 'Get all schedule templates' })
  findAll(@Req() req: any): Promise<ScheduleTemplate[]> {
    return this.service.findAll(req.user.companyId);
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', resourceType: 'schedule-template' })
  @ApiOperation({ summary: 'Get a schedule template by ID' })
  @ApiResponse({ status: 200, type: ScheduleTemplate })
  findOne(@Param('id') id: string): Promise<ScheduleTemplate> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'update', resourceType: 'schedule-template' })
  @ApiOperation({ summary: 'Update a schedule template' })
  @ApiResponse({ status: 200, type: ScheduleTemplate })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateScheduleTemplateDto,
  ): Promise<ScheduleTemplate> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'delete', resourceType: 'schedule-template' })
  @ApiOperation({ summary: 'Delete a schedule template' })
  @ApiResponse({ status: 200, type: ScheduleTemplate })
  remove(@Param('id') id: string): Promise<ScheduleTemplate> {
    return this.service.remove(id);
  }
}
