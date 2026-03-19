import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { PermissionsGuard } from '../../permissions/guards/permissions.guard';
import { RequirePermissions } from '../../permissions/decorators/require-permissions.decorator';
import { SurveyTemplateService } from '../services/survey-template.service';
import {
  CreateSurveyTemplateDto,
  UpdateSurveyTemplateDto,
} from '../dto/survey-template.dto';

@Controller('survey-templates')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SurveyTemplateController {
  constructor(private readonly templateService: SurveyTemplateService) {}

  @Post()
  @RequirePermissions({ action: 'create', resourceType: 'survey-template' })
  async create(@Request() req: any, @Body() dto: CreateSurveyTemplateDto) {
    return this.templateService.create(req.user.companyId, dto);
  }

  @Get()
  @RequirePermissions({ action: 'read', resourceType: 'survey-template' })
  async findAll(@Request() req: any) {
    return this.templateService.findAll(req.user.companyId);
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', resourceType: 'survey-template' })
  async findOne(@Param('id') id: string) {
    return this.templateService.findOne(id);
  }

  @Put(':id')
  @RequirePermissions({ action: 'update', resourceType: 'survey-template' })
  async update(@Param('id') id: string, @Body() dto: UpdateSurveyTemplateDto) {
    return this.templateService.update(id, dto);
  }

  @Post(':id/duplicate')
  @RequirePermissions({ action: 'create', resourceType: 'survey-template' })
  async duplicate(@Param('id') id: string, @Body('name') name: string) {
    return this.templateService.duplicateTemplate(id, name);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'delete', resourceType: 'survey-template' })
  async remove(@Param('id') id: string) {
    return this.templateService.remove(id);
  }
}
