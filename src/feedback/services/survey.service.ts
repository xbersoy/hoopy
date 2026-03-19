import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Survey } from '../entities/survey.entity';
import { SurveyQuestion } from '../entities/survey-question.entity';
import { SurveyAssignment } from '../entities/survey-assignment.entity';
import {
  SurveyRepository,
  SurveyQuestionRepository,
  SurveyQuestionOptionRepository,
  SurveyAssignmentRepository,
  SurveyTemplateRepository,
} from '../survey.repository';
import { CreateSurveyDto, UpdateSurveyDto, QuerySurveyDto } from '../dto/survey.dto';
import { CreateSurveyQuestionDto } from '../dto/survey-template.dto';
import { PaginatedResponse } from '../../shared/dto';
import { SurveyStatus, SurveyRecurrence, SurveyResponseStatus } from '../enums';

@Injectable()
export class SurveyService {
  constructor(
    @Inject('SurveyRepository')
    private readonly surveyRepository: SurveyRepository,

    @Inject('SurveyQuestionRepository')
    private readonly questionRepository: SurveyQuestionRepository,

    @Inject('SurveyQuestionOptionRepository')
    private readonly optionRepository: SurveyQuestionOptionRepository,

    @Inject('SurveyAssignmentRepository')
    private readonly assignmentRepository: SurveyAssignmentRepository,

    @Inject('SurveyTemplateRepository')
    private readonly templateRepository: SurveyTemplateRepository,
  ) {}

  async create(
    companyId: string,
    createdByUserId: string,
    dto: CreateSurveyDto,
  ): Promise<Survey> {
    // If from template, load template questions
    let templateQuestions: CreateSurveyQuestionDto[] | undefined;
    if (dto.templateId) {
      const template = await this.templateRepository.findOne(dto.templateId);
      if (template) {
        templateQuestions = template.questions?.map((q) => ({
          questionType: q.questionType,
          questionText: q.questionText,
          helpText: q.helpText,
          isRequired: q.isRequired,
          sortOrder: q.sortOrder,
          section: q.section,
          config: q.config,
          options: q.options?.map((o) => ({
            value: o.value,
            label: o.label,
            sortOrder: o.sortOrder,
          })),
        }));
      }
    }

    const survey = this.surveyRepository.create({
      companyId,
      title: dto.title,
      description: dto.description || null,
      templateId: dto.templateId || null,
      isAnonymous: dto.isAnonymous ?? true,
      isMandatory: dto.isMandatory ?? false,
      allowEditUntilDue: dto.allowEditUntilDue ?? false,
      scheduledPublishAt: dto.scheduledPublishAt
        ? new Date(dto.scheduledPublishAt)
        : null,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      closeDate: dto.closeDate ? new Date(dto.closeDate) : null,
      recurrence: dto.recurrence || SurveyRecurrence.ONCE,
      audienceType: dto.audienceType,
      audienceConfig: dto.audienceConfig || null,
      reminderSettings: dto.reminderSettings || null,
      anonymityThreshold: dto.anonymityThreshold ?? 5,
      createdByUserId,
      status: SurveyStatus.DRAFT,
    });

    const savedSurvey = await this.surveyRepository.save(survey);

    // Save questions (from dto or template)
    const questions = dto.questions || templateQuestions;
    if (questions?.length) {
      await this.saveQuestions(savedSurvey.id, questions);
    }

    return this.findOne(savedSurvey.id);
  }

  async findAll(
    companyId: string,
    query: QuerySurveyDto,
  ): Promise<PaginatedResponse<Survey>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const { data, total } = await this.surveyRepository.findPaginated({
      companyId,
      status: query.status,
      search: query.search,
      page,
      limit,
    });

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Survey> {
    const survey = await this.surveyRepository.findOne(id);
    if (!survey) {
      throw new NotFoundException(`Survey with ID "${id}" not found`);
    }
    return survey;
  }

  async update(id: string, dto: UpdateSurveyDto): Promise<Survey> {
    const survey = await this.findOne(id);

    if (survey.status !== SurveyStatus.DRAFT) {
      throw new BadRequestException('Can only edit draft surveys');
    }

    if (dto.title !== undefined) survey.title = dto.title;
    if (dto.description !== undefined) survey.description = dto.description || null;
    if (dto.isAnonymous !== undefined) survey.isAnonymous = dto.isAnonymous;
    if (dto.isMandatory !== undefined) survey.isMandatory = dto.isMandatory;
    if (dto.allowEditUntilDue !== undefined)
      survey.allowEditUntilDue = dto.allowEditUntilDue;
    if (dto.scheduledPublishAt !== undefined)
      survey.scheduledPublishAt = dto.scheduledPublishAt
        ? new Date(dto.scheduledPublishAt)
        : null;
    if (dto.startDate !== undefined)
      survey.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.dueDate !== undefined)
      survey.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if (dto.closeDate !== undefined)
      survey.closeDate = dto.closeDate ? new Date(dto.closeDate) : null;
    if (dto.recurrence !== undefined) survey.recurrence = dto.recurrence;
    if (dto.reminderSettings !== undefined)
      survey.reminderSettings = dto.reminderSettings || null;
    if (dto.anonymityThreshold !== undefined)
      survey.anonymityThreshold = dto.anonymityThreshold;

    await this.surveyRepository.save(survey);

    // Replace questions if provided
    if (dto.questions !== undefined) {
      await this.questionRepository.deleteBySurveyId(survey.id);
      if (dto.questions.length) {
        await this.saveQuestions(survey.id, dto.questions);
      }
    }

    return this.findOne(survey.id);
  }

  async publish(id: string, employeeIds: string[]): Promise<Survey> {
    const survey = await this.findOne(id);

    if (survey.status !== SurveyStatus.DRAFT) {
      throw new BadRequestException('Can only publish draft surveys');
    }

    if (!survey.questions?.length) {
      throw new BadRequestException('Survey must have at least one question');
    }

    if (employeeIds.length === 0) {
      throw new BadRequestException('At least one employee must be assigned');
    }

    // Create assignments
    const assignments = employeeIds.map((employeeId) =>
      this.assignmentRepository.create({
        surveyId: survey.id,
        employeeId,
        status: SurveyResponseStatus.NOT_STARTED,
        hasCompleted: false,
      }),
    );
    await this.assignmentRepository.saveAll(assignments);

    // Update survey status
    survey.status = SurveyStatus.ACTIVE;
    survey.publishedAt = new Date();

    return this.surveyRepository.save(survey);
  }

  async schedule(id: string, publishAt: Date): Promise<Survey> {
    const survey = await this.findOne(id);

    if (survey.status !== SurveyStatus.DRAFT) {
      throw new BadRequestException('Can only schedule draft surveys');
    }

    survey.status = SurveyStatus.SCHEDULED;
    survey.scheduledPublishAt = publishAt;

    return this.surveyRepository.save(survey);
  }

  async close(id: string): Promise<Survey> {
    const survey = await this.findOne(id);

    if (survey.status !== SurveyStatus.ACTIVE) {
      throw new BadRequestException('Can only close active surveys');
    }

    survey.status = SurveyStatus.CLOSED;
    survey.closedAt = new Date();

    return this.surveyRepository.save(survey);
  }

  async archive(id: string): Promise<Survey> {
    const survey = await this.findOne(id);
    survey.status = SurveyStatus.ARCHIVED;
    return this.surveyRepository.save(survey);
  }

  async remove(id: string): Promise<Survey> {
    const survey = await this.findOne(id);

    if (survey.status === SurveyStatus.ACTIVE) {
      throw new BadRequestException('Cannot delete an active survey');
    }

    const removed = await this.surveyRepository.remove(survey);
    return { ...removed, id };
  }

  // ─── Assignments ──────────────────────────────────────────

  async getAssignments(surveyId: string): Promise<SurveyAssignment[]> {
    return this.assignmentRepository.findBySurvey(surveyId);
  }

  async getMySurveys(employeeId: string): Promise<SurveyAssignment[]> {
    return this.assignmentRepository.findByEmployee(employeeId);
  }

  async getPendingSurveys(employeeId: string): Promise<SurveyAssignment[]> {
    return this.assignmentRepository.findPendingByEmployee(employeeId);
  }

  async getStats(surveyId: string): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    completionRate: number;
  }> {
    const total = await this.assignmentRepository.countBySurvey(surveyId);
    const completed = await this.assignmentRepository.countBySurveyAndStatus(
      surveyId,
      SurveyResponseStatus.SUBMITTED,
    );
    const inProgress = await this.assignmentRepository.countBySurveyAndStatus(
      surveyId,
      SurveyResponseStatus.IN_PROGRESS,
    );

    return {
      total,
      completed,
      inProgress,
      notStarted: total - completed - inProgress,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }

  // ─── Private Helpers ──────────────────────────────────────

  private async saveQuestions(
    surveyId: string,
    questions: CreateSurveyQuestionDto[],
  ): Promise<SurveyQuestion[]> {
    const savedQuestions: SurveyQuestion[] = [];

    for (let i = 0; i < questions.length; i++) {
      const qDto = questions[i];
      const question = this.questionRepository.create({
        surveyTemplateId: null,
        surveyId,
        questionType: qDto.questionType,
        questionText: qDto.questionText,
        helpText: qDto.helpText || null,
        isRequired: qDto.isRequired ?? false,
        sortOrder: qDto.sortOrder ?? i,
        section: qDto.section || null,
        config: qDto.config || null,
      });

      const savedQuestion = await this.questionRepository.save(question);

      if (qDto.options?.length) {
        const options = qDto.options.map((o, idx) =>
          this.optionRepository.create({
            questionId: savedQuestion.id,
            value: o.value,
            label: o.label,
            sortOrder: o.sortOrder ?? idx,
          }),
        );
        await this.optionRepository.saveAll(options);
      }

      savedQuestions.push(savedQuestion);
    }

    return savedQuestions;
  }
}
