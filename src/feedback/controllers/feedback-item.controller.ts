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
import { FeedbackItemService } from '../services/feedback-item.service';
import {
  CreateFeedbackItemDto,
  UpdateFeedbackItemDto,
  QueryFeedbackItemDto,
  AddFeedbackMessageDto,
} from '../dto/feedback-item.dto';

@Controller('items')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FeedbackItemController {
  constructor(private readonly feedbackService: FeedbackItemService) {}

  @Post()
  async create(@Request() req: any, @Body() dto: CreateFeedbackItemDto) {
    return this.feedbackService.create(req.user.companyId, req.user.id, dto);
  }

  @Get()
  @RequirePermissions({ action: 'read', resourceType: 'feedback-item' })
  async findAll(@Request() req: any, @Query() query: QueryFeedbackItemDto) {
    return this.feedbackService.findPaginated(req.user.companyId, query);
  }

  @Get('inbox')
  @RequirePermissions({ action: 'read', resourceType: 'feedback-item' })
  async inbox(@Request() req: any, @Query() query: QueryFeedbackItemDto) {
    return this.feedbackService.findPaginated(req.user.companyId, query);
  }

  @Get('my')
  async getMyFeedback(@Request() req: any) {
    return this.feedbackService.findBySubmitter(req.user.companyId, req.user.id);
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', resourceType: 'feedback-item' })
  async findOne(@Param('id') id: string) {
    return this.feedbackService.findOne(id);
  }

  @Put(':id')
  @RequirePermissions({ action: 'update', resourceType: 'feedback-item' })
  async update(@Param('id') id: string, @Body() dto: UpdateFeedbackItemDto) {
    return this.feedbackService.update(id, dto);
  }

  @Put(':id/assign')
  @RequirePermissions({ action: 'assign', resourceType: 'feedback-item' })
  async assign(
    @Param('id') id: string,
    @Body('assignedToUserId') assignedToUserId: string,
  ) {
    return this.feedbackService.assignTo(id, assignedToUserId);
  }

  @Put(':id/status')
  @RequirePermissions({ action: 'update', resourceType: 'feedback-item' })
  async changeStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('resolutionNotes') resolutionNotes?: string,
  ) {
    return this.feedbackService.update(id, { status: status as any, resolutionNotes });
  }

  @Post(':id/messages')
  async addMessage(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: AddFeedbackMessageDto,
  ) {
    return this.feedbackService.addMessage(id, req.user.id, dto);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'delete', resourceType: 'feedback-item' })
  async remove(@Param('id') id: string) {
    // Soft delete - just mark as closed
    return this.feedbackService.update(id, { status: 'closed' as any });
  }
}
