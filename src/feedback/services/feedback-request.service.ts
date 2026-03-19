import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FeedbackRequestTemplate } from '../entities/feedback-request-template.entity';
import { FeedbackRequest } from '../entities/feedback-request.entity';
import { FeedbackRequestAssignment } from '../entities/feedback-request-assignment.entity';
import {
  FeedbackRequestTemplateRepository,
  FeedbackRequestRepository,
  FeedbackRequestAssignmentRepository,
} from '../feedback.repository';
import {
  CreateFeedbackRequestTemplateDto,
  UpdateFeedbackRequestTemplateDto,
  CreateFeedbackRequestDto,
  UpdateFeedbackRequestDto,
  QueryFeedbackRequestDto,
} from '../dto/feedback-request.dto';
import { PaginatedResponse } from '../../shared/dto';
import {
  FeedbackRequestStatus,
  FeedbackAssignmentStatus,
  AudienceTargetType,
} from '../enums';

@Injectable()
export class FeedbackRequestService {
  constructor(
    @Inject('FeedbackRequestTemplateRepository')
    private readonly templateRepository: FeedbackRequestTemplateRepository,

    @Inject('FeedbackRequestRepository')
    private readonly requestRepository: FeedbackRequestRepository,

    @Inject('FeedbackRequestAssignmentRepository')
    private readonly assignmentRepository: FeedbackRequestAssignmentRepository,
  ) {}

  // ─── Templates ────────────────────────────────────────────

  async createTemplate(
    companyId: string,
    dto: CreateFeedbackRequestTemplateDto,
  ): Promise<FeedbackRequestTemplate> {
    const template = this.templateRepository.create({
      companyId,
      name: dto.name,
      description: dto.description || null,
      defaultTitle: dto.defaultTitle,
      defaultInstructions: dto.defaultInstructions || null,
      defaultCategoryId: dto.defaultCategoryId || null,
      defaultSubmissionMode: dto.defaultSubmissionMode,
      defaultDueDays: dto.defaultDueDays || null,
    });

    return this.templateRepository.save(template);
  }

  async findAllTemplates(companyId: string): Promise<FeedbackRequestTemplate[]> {
    return this.templateRepository.findByCompany(companyId);
  }

  async findTemplate(id: string): Promise<FeedbackRequestTemplate> {
    const template = await this.templateRepository.findOne(id);
    if (!template) {
      throw new NotFoundException(`Feedback request template with ID "${id}" not found`);
    }
    return template;
  }

  async updateTemplate(
    id: string,
    dto: UpdateFeedbackRequestTemplateDto,
  ): Promise<FeedbackRequestTemplate> {
    const template = await this.findTemplate(id);

    if (dto.name !== undefined) template.name = dto.name;
    if (dto.description !== undefined) template.description = dto.description || null;
    if (dto.defaultTitle !== undefined) template.defaultTitle = dto.defaultTitle;
    if (dto.defaultInstructions !== undefined)
      template.defaultInstructions = dto.defaultInstructions || null;
    if (dto.defaultCategoryId !== undefined)
      template.defaultCategoryId = dto.defaultCategoryId || null;
    if (dto.defaultSubmissionMode !== undefined)
      template.defaultSubmissionMode = dto.defaultSubmissionMode;
    if (dto.defaultDueDays !== undefined)
      template.defaultDueDays = dto.defaultDueDays || null;
    if (dto.isActive !== undefined) template.isActive = dto.isActive;

    return this.templateRepository.save(template);
  }

  async removeTemplate(id: string): Promise<FeedbackRequestTemplate> {
    const template = await this.findTemplate(id);
    const removed = await this.templateRepository.remove(template);
    return { ...removed, id };
  }

  // ─── Requests ─────────────────────────────────────────────

  async createRequest(
    companyId: string,
    createdByUserId: string,
    dto: CreateFeedbackRequestDto,
  ): Promise<FeedbackRequest> {
    const request = this.requestRepository.create({
      companyId,
      title: dto.title,
      instructions: dto.instructions || null,
      categoryId: dto.categoryId || null,
      templateId: dto.templateId || null,
      submissionMode: dto.submissionMode,
      isMandatory: dto.isMandatory ?? false,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      audienceType: dto.audienceType,
      audienceConfig: dto.audienceConfig || null,
      reminderSettings: dto.reminderSettings || null,
      createdByUserId,
      status: FeedbackRequestStatus.DRAFT,
    });

    return this.requestRepository.save(request);
  }

  async findAllRequests(
    companyId: string,
    query: QueryFeedbackRequestDto,
  ): Promise<PaginatedResponse<FeedbackRequest>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const { data, total } = await this.requestRepository.findPaginated({
      companyId,
      status: query.status,
      search: query.search,
      page,
      limit,
    });

    return { data, total, page, limit };
  }

  async findRequest(id: string): Promise<FeedbackRequest> {
    const request = await this.requestRepository.findOne(id);
    if (!request) {
      throw new NotFoundException(`Feedback request with ID "${id}" not found`);
    }
    return request;
  }

  async updateRequest(
    id: string,
    dto: UpdateFeedbackRequestDto,
  ): Promise<FeedbackRequest> {
    const request = await this.findRequest(id);

    if (
      request.status !== FeedbackRequestStatus.DRAFT &&
      dto.status !== FeedbackRequestStatus.CLOSED &&
      dto.status !== FeedbackRequestStatus.CANCELLED
    ) {
      throw new BadRequestException('Can only edit draft requests');
    }

    if (dto.title !== undefined) request.title = dto.title;
    if (dto.instructions !== undefined)
      request.instructions = dto.instructions || null;
    if (dto.categoryId !== undefined) request.categoryId = dto.categoryId || null;
    if (dto.status !== undefined) request.status = dto.status;
    if (dto.isMandatory !== undefined) request.isMandatory = dto.isMandatory;
    if (dto.dueDate !== undefined)
      request.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if (dto.reminderSettings !== undefined)
      request.reminderSettings = dto.reminderSettings || null;

    return this.requestRepository.save(request);
  }

  async activateRequest(
    id: string,
    employeeIds: string[],
  ): Promise<FeedbackRequest> {
    const request = await this.findRequest(id);

    if (request.status !== FeedbackRequestStatus.DRAFT) {
      throw new BadRequestException('Can only activate draft requests');
    }

    if (employeeIds.length === 0) {
      throw new BadRequestException('At least one employee must be assigned');
    }

    // Create assignments
    const assignments = employeeIds.map((employeeId) =>
      this.assignmentRepository.create({
        feedbackRequestId: request.id,
        employeeId,
        status: FeedbackAssignmentStatus.PENDING,
      }),
    );
    await this.assignmentRepository.saveAll(assignments);

    // Activate request
    request.status = FeedbackRequestStatus.ACTIVE;
    request.activatedAt = new Date();

    return this.requestRepository.save(request);
  }

  async closeRequest(id: string): Promise<FeedbackRequest> {
    const request = await this.findRequest(id);
    request.status = FeedbackRequestStatus.CLOSED;
    request.closedAt = new Date();
    return this.requestRepository.save(request);
  }

  async cancelRequest(id: string): Promise<FeedbackRequest> {
    const request = await this.findRequest(id);
    request.status = FeedbackRequestStatus.CANCELLED;
    return this.requestRepository.save(request);
  }

  // ─── Assignments ──────────────────────────────────────────

  async getAssignments(requestId: string): Promise<FeedbackRequestAssignment[]> {
    return this.assignmentRepository.findByRequest(requestId);
  }

  async getMyAssignments(employeeId: string): Promise<FeedbackRequestAssignment[]> {
    return this.assignmentRepository.findByEmployee(employeeId);
  }

  async getPendingAssignments(
    employeeId: string,
  ): Promise<FeedbackRequestAssignment[]> {
    return this.assignmentRepository.findPendingByEmployee(employeeId);
  }

  async markAssignmentCompleted(
    assignmentId: string,
    feedbackItemId: string,
  ): Promise<FeedbackRequestAssignment> {
    const assignment = await this.assignmentRepository.findOne(assignmentId);
    if (!assignment) {
      throw new NotFoundException(`Assignment with ID "${assignmentId}" not found`);
    }

    assignment.status = FeedbackAssignmentStatus.COMPLETED;
    assignment.feedbackItemId = feedbackItemId;
    assignment.completedAt = new Date();

    return this.assignmentRepository.save(assignment);
  }

  async getRequestStats(requestId: string): Promise<{
    total: number;
    pending: number;
    completed: number;
    overdue: number;
    completionRate: number;
  }> {
    const assignments = await this.assignmentRepository.findByRequest(requestId);
    const request = await this.findRequest(requestId);

    const total = assignments.length;
    const pending = assignments.filter(
      (a) => a.status === FeedbackAssignmentStatus.PENDING,
    ).length;
    const completed = assignments.filter(
      (a) => a.status === FeedbackAssignmentStatus.COMPLETED,
    ).length;

    const now = new Date();
    const overdue =
      request.dueDate && now > request.dueDate
        ? assignments.filter((a) => a.status === FeedbackAssignmentStatus.PENDING).length
        : 0;

    return {
      total,
      pending,
      completed,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }
}
