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
import { FeedbackRequestService } from '../services/feedback-request.service';
import {
  CreateFeedbackRequestDto,
  UpdateFeedbackRequestDto,
  QueryFeedbackRequestDto,
} from '../dto/feedback-request.dto';

@Controller('requests')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FeedbackRequestController {
  constructor(private readonly requestService: FeedbackRequestService) {}

  @Post()
  @RequirePermissions({ action: 'create', resourceType: 'feedback-request' })
  async create(@Request() req: any, @Body() dto: CreateFeedbackRequestDto) {
    return this.requestService.createRequest(req.user.companyId, req.user.id, dto);
  }

  @Get()
  @RequirePermissions({ action: 'read', resourceType: 'feedback-request' })
  async findAll(@Request() req: any, @Query() query: QueryFeedbackRequestDto) {
    return this.requestService.findAllRequests(req.user.companyId, query);
  }

  @Get('my-assignments')
  async getMyRequests(@Request() req: any) {
    return this.requestService.getMyAssignments(req.user.employeeId);
  }

  @Get('my/pending')
  async getMyPendingRequests(@Request() req: any) {
    return this.requestService.getPendingAssignments(req.user.employeeId);
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', resourceType: 'feedback-request' })
  async findOne(@Param('id') id: string) {
    return this.requestService.findRequest(id);
  }

  @Put(':id')
  @RequirePermissions({ action: 'update', resourceType: 'feedback-request' })
  async update(@Param('id') id: string, @Body() dto: UpdateFeedbackRequestDto) {
    return this.requestService.updateRequest(id, dto);
  }

  @Post(':id/publish')
  @RequirePermissions({ action: 'publish', resourceType: 'feedback-request' })
  async publish(
    @Param('id') id: string,
    @Body('employeeIds') employeeIds: string[],
  ) {
    return this.requestService.activateRequest(id, employeeIds);
  }

  @Post(':id/close')
  @RequirePermissions({ action: 'update', resourceType: 'feedback-request' })
  async close(@Param('id') id: string) {
    return this.requestService.closeRequest(id);
  }

  @Post(':id/cancel')
  @RequirePermissions({ action: 'update', resourceType: 'feedback-request' })
  async cancel(@Param('id') id: string) {
    return this.requestService.cancelRequest(id);
  }

  @Get(':id/stats')
  @RequirePermissions({ action: 'read', resourceType: 'feedback-request' })
  async getStats(@Param('id') id: string) {
    return this.requestService.getRequestStats(id);
  }

  @Post(':id/complete')
  async complete(
    @Request() req: any,
    @Param('id') id: string,
    @Body('feedbackItemId') feedbackItemId: string,
  ) {
    // Get the assignment for this employee
    const assignments = await this.requestService.getAssignments(id);
    const assignment = assignments.find(a => a.employeeId === req.user.employeeId);
    if (!assignment) {
      throw new Error('Assignment not found');
    }
    return this.requestService.markAssignmentCompleted(assignment.id, feedbackItemId);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'delete', resourceType: 'feedback-request' })
  async remove(@Param('id') id: string) {
    return this.requestService.cancelRequest(id);
  }
}
