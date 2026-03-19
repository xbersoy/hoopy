import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { PermissionsGuard } from '../../permissions/guards/permissions.guard';
import { RequirePermissions } from '../../permissions/decorators/require-permissions.decorator';
import { SurveyService } from '../services/survey.service';
import { SurveyAnalyticsService } from '../services/survey-analytics.service';
import { CreateSurveyDto, UpdateSurveyDto, QuerySurveyDto } from '../dto/survey.dto';

@Controller('surveys')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SurveyController {
  constructor(
    private readonly surveyService: SurveyService,
    private readonly analyticsService: SurveyAnalyticsService,
  ) {}

  @Post()
  @RequirePermissions({ action: 'create', resourceType: 'survey' })
  async create(@Request() req: any, @Body() dto: CreateSurveyDto) {
    return this.surveyService.create(req.user.companyId, req.user.id, dto);
  }

  @Get()
  @RequirePermissions({ action: 'read', resourceType: 'survey' })
  async findAll(@Request() req: any, @Query() query: QuerySurveyDto) {
    return this.surveyService.findAll(req.user.companyId, query);
  }

  @Get('my-assignments')
  async getMySurveys(@Request() req: any) {
    return this.surveyService.getMySurveys(req.user.employeeId);
  }

  @Get('my/pending')
  async getMyPendingSurveys(@Request() req: any) {
    return this.surveyService.getPendingSurveys(req.user.employeeId);
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', resourceType: 'survey' })
  async findOne(@Param('id') id: string) {
    return this.surveyService.findOne(id);
  }

  @Put(':id')
  @RequirePermissions({ action: 'update', resourceType: 'survey' })
  async update(@Param('id') id: string, @Body() dto: UpdateSurveyDto) {
    return this.surveyService.update(id, dto);
  }

  @Post(':id/publish')
  @RequirePermissions({ action: 'publish', resourceType: 'survey' })
  async publish(
    @Param('id') id: string,
    @Body('employeeIds') employeeIds: string[],
  ) {
    return this.surveyService.publish(id, employeeIds);
  }

  @Post(':id/schedule')
  @RequirePermissions({ action: 'publish', resourceType: 'survey' })
  async schedule(
    @Param('id') id: string,
    @Body('publishAt') publishAt: string,
  ) {
    return this.surveyService.schedule(id, new Date(publishAt));
  }

  @Post(':id/close')
  @RequirePermissions({ action: 'update', resourceType: 'survey' })
  async close(@Param('id') id: string) {
    return this.surveyService.close(id);
  }

  @Post(':id/archive')
  @RequirePermissions({ action: 'update', resourceType: 'survey' })
  async archive(@Param('id') id: string) {
    return this.surveyService.archive(id);
  }

  @Get(':id/assignments')
  @RequirePermissions({ action: 'read', resourceType: 'survey' })
  async getAssignments(@Param('id') id: string) {
    return this.surveyService.getAssignments(id);
  }

  @Get(':id/stats')
  @RequirePermissions({ action: 'read', resourceType: 'survey' })
  async getStats(@Param('id') id: string) {
    return this.surveyService.getStats(id);
  }

  @Get(':id/analytics')
  @RequirePermissions({ action: 'read', resourceType: 'survey-analytics' })
  async getAnalytics(@Param('id') id: string) {
    return this.analyticsService.getSurveyAnalytics(id);
  }

  @Get(':id/participation')
  @RequirePermissions({ action: 'read', resourceType: 'survey' })
  async getParticipation(@Param('id') id: string) {
    return this.analyticsService.getParticipationMetrics(id);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'delete', resourceType: 'survey' })
  async remove(@Param('id') id: string) {
    return this.surveyService.remove(id);
  }
}
