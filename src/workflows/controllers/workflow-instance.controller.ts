import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { WorkflowEngineService } from '../services/workflow-engine.service';
import {
  StartWorkflowDto,
  WorkflowStepActionDto,
  CancelWorkflowDto,
} from '../dto/workflow-instance.dto';
import { WorkflowInstanceStatus } from '../enums/workflow.enums';

@ApiTags('Workflow Instances')
@ApiBearerAuth()
@Controller('workflows/instances')
@UseGuards(JwtAuthGuard)
export class WorkflowInstanceController {
  constructor(private readonly engineService: WorkflowEngineService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a new workflow instance' })
  start(@Req() req, @Body() dto: StartWorkflowDto) {
    return this.engineService.startWorkflow(
      req.user.companyId,
      req.user.id,
      dto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List workflow instances for the company' })
  @ApiQuery({ name: 'status', required: false, enum: WorkflowInstanceStatus })
  @ApiQuery({ name: 'resourceType', required: false })
  @ApiQuery({ name: 'resourceId', required: false })
  findAll(
    @Req() req,
    @Query('status') status?: WorkflowInstanceStatus,
    @Query('resourceType') resourceType?: string,
    @Query('resourceId') resourceId?: string,
  ) {
    return this.engineService.findInstancesByCompany(req.user.companyId, {
      status,
      resourceType,
      resourceId,
    });
  }

  @Get('my-tasks')
  @ApiOperation({ summary: 'Get pending tasks assigned to the current user' })
  getMyTasks(@Req() req) {
    return this.engineService.findMyPendingTasks(req.user.companyId, req.user.id);
  }

  @Get('by-resource/:resourceType/:resourceId')
  @ApiOperation({ summary: 'Find workflow instances for a specific resource' })
  findByResource(
    @Req() req,
    @Param('resourceType') resourceType: string,
    @Param('resourceId') resourceId: string,
  ) {
    return this.engineService.findInstanceByResource(
      req.user.companyId,
      resourceType,
      resourceId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific workflow instance' })
  findOne(@Req() req, @Param('id') id: string) {
    return this.engineService.findInstanceById(req.user.companyId, id);
  }

  @Post(':id/steps/:stepId/action')
  @ApiOperation({ summary: 'Take action on a workflow step (approve, reject, return, etc.)' })
  takeAction(
    @Req() req,
    @Param('id') id: string,
    @Param('stepId') stepId: string,
    @Body() dto: WorkflowStepActionDto,
  ) {
    return this.engineService.takeStepAction(
      req.user.companyId,
      req.user.id,
      id,
      stepId,
      dto,
    );
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a workflow instance' })
  cancel(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: CancelWorkflowDto,
  ) {
    return this.engineService.cancelWorkflow(
      req.user.companyId,
      req.user.id,
      id,
      dto,
    );
  }
}
