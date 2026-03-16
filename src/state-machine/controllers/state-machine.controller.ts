import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { StateMachineService } from '../services/state-machine.service';
import {
  CreateStateMachineDefinitionDto,
  CreateStateMachineInstanceDto,
  ExecuteTransitionDto,
} from '../dto/state-machine.dto';

@ApiTags('State Machine')
@ApiBearerAuth()
@Controller('state-machines')
@UseGuards(JwtAuthGuard)
export class StateMachineController {
  constructor(private readonly smService: StateMachineService) {}

  // ─── Definitions ───

  @Get('definitions')
  @ApiOperation({ summary: 'List all state machine definitions for the company' })
  listDefinitions(@Req() req) {
    return this.smService.findDefinitionsByCompany(req.user.companyId);
  }

  @Get('definitions/:id')
  @ApiOperation({ summary: 'Get a state machine definition by ID' })
  getDefinition(@Req() req, @Param('id') id: string) {
    return this.smService.findDefinitionById(req.user.companyId, id);
  }

  @Post('definitions')
  @ApiOperation({ summary: 'Create a new state machine definition' })
  createDefinition(@Req() req, @Body() dto: CreateStateMachineDefinitionDto) {
    return this.smService.createDefinition(req.user.companyId, dto);
  }

  @Post('definitions/:id/publish')
  @ApiOperation({ summary: 'Publish a draft definition' })
  publishDefinition(@Req() req, @Param('id') id: string) {
    return this.smService.publishDefinition(req.user.companyId, id);
  }

  @Post('definitions/:id/archive')
  @ApiOperation({ summary: 'Archive a definition' })
  archiveDefinition(@Req() req, @Param('id') id: string) {
    return this.smService.archiveDefinition(req.user.companyId, id);
  }

  @Delete('definitions/:id')
  @ApiOperation({ summary: 'Delete a state machine definition' })
  deleteDefinition(@Req() req, @Param('id') id: string) {
    return this.smService.deleteDefinition(req.user.companyId, id);
  }

  // ─── Instances ───

  @Post('instances')
  @ApiOperation({ summary: 'Create a new state machine instance' })
  createInstance(@Req() req, @Body() dto: CreateStateMachineInstanceDto) {
    return this.smService.createInstance(
      req.user.companyId,
      dto.definitionId,
      dto.resourceType,
      dto.resourceId,
      dto.context,
      dto.metadata,
    );
  }

  @Get('instances/:id')
  @ApiOperation({ summary: 'Get a state machine instance by ID' })
  getInstance(@Req() req, @Param('id') id: string) {
    return this.smService.findInstanceById(req.user.companyId, id);
  }

  @Get('instances/:id/available-transitions')
  @ApiOperation({ summary: 'Get available transitions for an instance' })
  getAvailableTransitions(@Req() req, @Param('id') id: string) {
    return this.smService.getAvailableTransitions(req.user.companyId, id);
  }

  @Post('instances/:id/transition')
  @ApiOperation({ summary: 'Execute a transition on an instance' })
  executeTransition(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: ExecuteTransitionDto,
  ) {
    return this.smService.executeTransition(req.user.companyId, id, {
      transitionCode: dto.transitionCode,
      actorId: req.user.id,
      comment: dto.comment,
      context: dto.context,
      metadata: dto.metadata,
    });
  }

  @Get('by-resource/:resourceType/:resourceId')
  @ApiOperation({ summary: 'Find state machine instances for a resource' })
  findByResource(
    @Req() req,
    @Param('resourceType') resourceType: string,
    @Param('resourceId') resourceId: string,
  ) {
    return this.smService.findInstancesByResource(
      req.user.companyId,
      resourceType,
      resourceId,
    );
  }
}
