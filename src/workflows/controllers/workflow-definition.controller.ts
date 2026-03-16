import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { WorkflowDefinitionService } from '../services/workflow-definition.service';
import {
  CreateWorkflowDefinitionDto,
  UpdateWorkflowDefinitionDto,
  UpdateWorkflowVersionDraftDto,
} from '../dto/workflow-definition.dto';

@ApiTags('Workflow Definitions')
@ApiBearerAuth()
@Controller('workflows/definitions')
@UseGuards(JwtAuthGuard)
export class WorkflowDefinitionController {
  constructor(private readonly definitionService: WorkflowDefinitionService) {}

  @Get()
  @ApiOperation({ summary: 'List all workflow definitions for the company' })
  findAll(@Req() req) {
    return this.definitionService.findAllByCompany(req.user.companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a workflow definition by ID' })
  findOne(@Req() req, @Param('id') id: string) {
    return this.definitionService.findOneById(req.user.companyId, id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new workflow definition with initial draft version',
  })
  create(@Req() req, @Body() dto: CreateWorkflowDefinitionDto) {
    return this.definitionService.create(req.user.companyId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update workflow definition metadata' })
  update(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: UpdateWorkflowDefinitionDto,
  ) {
    return this.definitionService.update(req.user.companyId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a workflow definition' })
  remove(@Req() req, @Param('id') id: string) {
    return this.definitionService.remove(req.user.companyId, id);
  }

  // ─── Versions ───

  @Get(':id/versions/:versionId')
  @ApiOperation({ summary: 'Get a specific version of a workflow definition' })
  getVersion(
    @Req() req,
    @Param('id') id: string,
    @Param('versionId') versionId: string,
  ) {
    return this.definitionService.getVersion(req.user.companyId, id, versionId);
  }

  @Get(':id/versions/published')
  @ApiOperation({ summary: 'Get the currently published version' })
  getPublishedVersion(@Req() req, @Param('id') id: string) {
    return this.definitionService.getPublishedVersion(req.user.companyId, id);
  }

  @Post(':id/versions')
  @ApiOperation({ summary: 'Create a new draft version' })
  createVersion(@Req() req, @Param('id') id: string) {
    return this.definitionService.createNewVersion(req.user.companyId, id);
  }

  @Patch(':id/versions/:versionId')
  @ApiOperation({
    summary: 'Update a draft version (steps, transitions, config)',
  })
  updateVersion(
    @Req() req,
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @Body() dto: UpdateWorkflowVersionDraftDto,
  ) {
    return this.definitionService.updateVersionDraft(
      req.user.companyId,
      id,
      versionId,
      dto,
    );
  }

  @Post(':id/versions/:versionId/publish')
  @ApiOperation({
    summary:
      'Publish a draft version (archives any currently published version)',
  })
  publishVersion(
    @Req() req,
    @Param('id') id: string,
    @Param('versionId') versionId: string,
  ) {
    return this.definitionService.publishVersion(
      req.user.companyId,
      id,
      versionId,
    );
  }

  @Post(':id/versions/:versionId/archive')
  @ApiOperation({ summary: 'Archive a version' })
  archiveVersion(
    @Req() req,
    @Param('id') id: string,
    @Param('versionId') versionId: string,
  ) {
    return this.definitionService.archiveVersion(
      req.user.companyId,
      id,
      versionId,
    );
  }
}
