import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { FeedbackItem } from '../entities/feedback-item.entity';
import { FeedbackMessage } from '../entities/feedback-message.entity';
import {
  FeedbackItemRepository,
  FeedbackMessageRepository,
  FeedbackAttachmentRepository,
  FeedbackCategoryRepository,
} from '../feedback.repository';
import {
  CreateFeedbackItemDto,
  UpdateFeedbackItemDto,
  AddFeedbackMessageDto,
  QueryFeedbackItemDto,
} from '../dto/feedback-item.dto';
import { PaginatedResponse } from '../../shared/dto';
import {
  FeedbackSubmissionMode,
  FeedbackStatus,
  FeedbackSensitivity,
} from '../enums';

@Injectable()
export class FeedbackItemService {
  constructor(
    @Inject('FeedbackItemRepository')
    private readonly itemRepository: FeedbackItemRepository,

    @Inject('FeedbackMessageRepository')
    private readonly messageRepository: FeedbackMessageRepository,

    @Inject('FeedbackAttachmentRepository')
    private readonly attachmentRepository: FeedbackAttachmentRepository,

    @Inject('FeedbackCategoryRepository')
    private readonly categoryRepository: FeedbackCategoryRepository,
  ) {}

  async create(
    companyId: string,
    employeeId: string | null,
    dto: CreateFeedbackItemDto,
  ): Promise<FeedbackItem> {
    // Validate category
    const category = await this.categoryRepository.findOne(dto.categoryId);
    if (!category || category.companyId !== companyId) {
      throw new BadRequestException('Invalid category');
    }

    // Check anonymous permission
    if (dto.submissionMode === FeedbackSubmissionMode.ANONYMOUS && !category.allowAnonymous) {
      throw new BadRequestException('Anonymous submissions are not allowed for this category');
    }

    // For anonymous mode, don't store employee ID
    const submittedById =
      dto.submissionMode === FeedbackSubmissionMode.ANONYMOUS ? null : employeeId;

    const item = this.itemRepository.create({
      companyId,
      categoryId: dto.categoryId,
      submissionMode: dto.submissionMode,
      subject: dto.subject,
      body: dto.body,
      sensitivity: dto.sensitivity || category.defaultSensitivity,
      submittedById,
      feedbackRequestId: dto.feedbackRequestId || null,
      metadata: dto.metadata || null,
      status: FeedbackStatus.SUBMITTED,
    });

    return this.itemRepository.save(item);
  }

  async findPaginated(
    companyId: string,
    query: QueryFeedbackItemDto,
  ): Promise<PaginatedResponse<FeedbackItem>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const { data, total } = await this.itemRepository.findPaginated({
      companyId,
      categoryId: query.categoryId,
      status: query.status,
      submissionMode: query.submissionMode,
      sensitivity: query.sensitivity,
      assignedToUserId: query.assignedToUserId,
      search: query.search,
      page,
      limit,
    });

    return { data, total, page, limit };
  }

  async findBySubmitter(
    companyId: string,
    submittedById: string,
  ): Promise<FeedbackItem[]> {
    return this.itemRepository.findBySubmitter(companyId, submittedById);
  }

  async findOne(id: string): Promise<FeedbackItem> {
    const item = await this.itemRepository.findOne(id);
    if (!item) {
      throw new NotFoundException(`Feedback item with ID "${id}" not found`);
    }
    return item;
  }

  async update(id: string, dto: UpdateFeedbackItemDto): Promise<FeedbackItem> {
    const item = await this.findOne(id);

    if (dto.status !== undefined) {
      this.validateStatusTransition(item.status, dto.status);
      item.status = dto.status;

      if (dto.status === FeedbackStatus.RESOLVED) {
        item.resolvedAt = new Date();
      } else if (dto.status === FeedbackStatus.CLOSED) {
        item.closedAt = new Date();
      }
    }

    if (dto.sensitivity !== undefined) item.sensitivity = dto.sensitivity;
    if (dto.assignedToUserId !== undefined)
      item.assignedToUserId = dto.assignedToUserId || null;
    if (dto.resolutionNotes !== undefined)
      item.resolutionNotes = dto.resolutionNotes || null;
    if (dto.metadata !== undefined) item.metadata = dto.metadata || null;

    return this.itemRepository.save(item);
  }

  async addMessage(
    feedbackItemId: string,
    authorUserId: string | null,
    dto: AddFeedbackMessageDto,
  ): Promise<FeedbackMessage> {
    const item = await this.findOne(feedbackItemId);

    const message = this.messageRepository.create({
      feedbackItemId: item.id,
      content: dto.content,
      isInternal: dto.isInternal ?? false,
      authorUserId,
    });

    return this.messageRepository.save(message);
  }

  async getMessages(feedbackItemId: string): Promise<FeedbackMessage[]> {
    await this.findOne(feedbackItemId); // Ensure exists
    return this.messageRepository.findByFeedbackItem(feedbackItemId);
  }

  async markAsReceived(id: string): Promise<FeedbackItem> {
    return this.update(id, { status: FeedbackStatus.RECEIVED });
  }

  async assignTo(id: string, userId: string): Promise<FeedbackItem> {
    return this.update(id, {
      assignedToUserId: userId,
      status: FeedbackStatus.UNDER_REVIEW,
    });
  }

  async escalate(id: string): Promise<FeedbackItem> {
    const item = await this.findOne(id);
    item.status = FeedbackStatus.ESCALATED;
    item.sensitivity = FeedbackSensitivity.CRITICAL;
    return this.itemRepository.save(item);
  }

  private validateStatusTransition(
    currentStatus: FeedbackStatus,
    newStatus: FeedbackStatus,
  ): void {
    const allowedTransitions: Record<FeedbackStatus, FeedbackStatus[]> = {
      [FeedbackStatus.SUBMITTED]: [
        FeedbackStatus.RECEIVED,
        FeedbackStatus.DISMISSED,
        FeedbackStatus.ESCALATED,
      ],
      [FeedbackStatus.RECEIVED]: [
        FeedbackStatus.UNDER_REVIEW,
        FeedbackStatus.DISMISSED,
        FeedbackStatus.ESCALATED,
      ],
      [FeedbackStatus.UNDER_REVIEW]: [
        FeedbackStatus.NEEDS_MORE_INFO,
        FeedbackStatus.IN_PROGRESS,
        FeedbackStatus.RESOLVED,
        FeedbackStatus.DISMISSED,
        FeedbackStatus.ESCALATED,
      ],
      [FeedbackStatus.NEEDS_MORE_INFO]: [
        FeedbackStatus.UNDER_REVIEW,
        FeedbackStatus.IN_PROGRESS,
        FeedbackStatus.DISMISSED,
      ],
      [FeedbackStatus.IN_PROGRESS]: [
        FeedbackStatus.RESOLVED,
        FeedbackStatus.NEEDS_MORE_INFO,
        FeedbackStatus.ESCALATED,
      ],
      [FeedbackStatus.RESOLVED]: [FeedbackStatus.CLOSED],
      [FeedbackStatus.CLOSED]: [],
      [FeedbackStatus.DISMISSED]: [],
      [FeedbackStatus.ESCALATED]: [
        FeedbackStatus.UNDER_REVIEW,
        FeedbackStatus.IN_PROGRESS,
        FeedbackStatus.RESOLVED,
      ],
    };

    if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from "${currentStatus}" to "${newStatus}"`,
      );
    }
  }
}
