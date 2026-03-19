import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SurveyResponse } from '../entities/survey-response.entity';
import { SurveyAnswer } from '../entities/survey-answer.entity';
import {
  SurveyRepository,
  SurveyAssignmentRepository,
  SurveyResponseRepository,
  SurveyAnswerRepository,
  SurveyQuestionRepository,
} from '../survey.repository';
import { SubmitSurveyResponseDto } from '../dto/survey-response.dto';
import { SurveyStatus, SurveyResponseStatus } from '../enums';

@Injectable()
export class SurveyResponseService {
  constructor(
    @Inject('SurveyRepository')
    private readonly surveyRepository: SurveyRepository,

    @Inject('SurveyAssignmentRepository')
    private readonly assignmentRepository: SurveyAssignmentRepository,

    @Inject('SurveyResponseRepository')
    private readonly responseRepository: SurveyResponseRepository,

    @Inject('SurveyAnswerRepository')
    private readonly answerRepository: SurveyAnswerRepository,

    @Inject('SurveyQuestionRepository')
    private readonly questionRepository: SurveyQuestionRepository,
  ) {}

  async startSurvey(
    surveyId: string,
    employeeId: string,
  ): Promise<SurveyResponse> {
    const survey = await this.surveyRepository.findOne(surveyId);
    if (!survey) {
      throw new NotFoundException(`Survey with ID "${surveyId}" not found`);
    }

    if (survey.status !== SurveyStatus.ACTIVE) {
      throw new BadRequestException('Survey is not active');
    }

    // Check assignment
    const assignment = await this.assignmentRepository.findBySurveyAndEmployee(
      surveyId,
      employeeId,
    );
    if (!assignment) {
      throw new ForbiddenException('You are not assigned to this survey');
    }

    if (assignment.hasCompleted) {
      throw new BadRequestException('You have already completed this survey');
    }

    // Check for existing response
    const existingResponse = survey.isAnonymous
      ? null
      : await this.responseRepository.findBySurveyAndRespondent(surveyId, employeeId);

    if (existingResponse) {
      return existingResponse;
    }

    // Create new response
    const response = this.responseRepository.create({
      surveyId,
      respondentId: survey.isAnonymous ? null : employeeId,
      status: SurveyResponseStatus.IN_PROGRESS,
    });

    const savedResponse = await this.responseRepository.save(response);

    // Update assignment status
    assignment.status = SurveyResponseStatus.IN_PROGRESS;
    assignment.startedAt = new Date();
    await this.assignmentRepository.save(assignment);

    return savedResponse;
  }

  async submitResponse(
    surveyId: string,
    employeeId: string,
    dto: SubmitSurveyResponseDto,
  ): Promise<SurveyResponse> {
    const survey = await this.surveyRepository.findOne(surveyId);
    if (!survey) {
      throw new NotFoundException(`Survey with ID "${surveyId}" not found`);
    }

    if (survey.status !== SurveyStatus.ACTIVE) {
      throw new BadRequestException('Survey is not active');
    }

    // Check assignment
    const assignment = await this.assignmentRepository.findBySurveyAndEmployee(
      surveyId,
      employeeId,
    );
    if (!assignment) {
      throw new ForbiddenException('You are not assigned to this survey');
    }

    // Check if already completed and editing is not allowed
    if (assignment.hasCompleted && !survey.allowEditUntilDue) {
      throw new BadRequestException('You have already completed this survey');
    }

    // Check due date for edits
    if (
      assignment.hasCompleted &&
      survey.allowEditUntilDue &&
      survey.dueDate &&
      new Date() > survey.dueDate
    ) {
      throw new BadRequestException('Survey due date has passed');
    }

    // Find or create response
    let response = survey.isAnonymous
      ? null
      : await this.responseRepository.findBySurveyAndRespondent(surveyId, employeeId);

    if (!response) {
      response = await this.startSurvey(surveyId, employeeId);
    }

    // Validate required questions
    const questions = await this.questionRepository.findBySurvey(surveyId);
    const requiredQuestionIds = questions
      .filter((q) => q.isRequired)
      .map((q) => q.id);

    const answeredQuestionIds = dto.answers.map((a) => a.questionId);

    for (const reqId of requiredQuestionIds) {
      if (!answeredQuestionIds.includes(reqId)) {
        throw new BadRequestException(`Missing required question: ${reqId}`);
      }
    }

    // Delete existing answers and save new ones
    await this.answerRepository.deleteByResponseId(response.id);

    const answers = dto.answers.map((a) =>
      this.answerRepository.create({
        responseId: response!.id,
        questionId: a.questionId,
        textValue: a.textValue || null,
        numericValue: a.numericValue ?? null,
        selectedOptionId: a.selectedOptionId || null,
        selectedOptionIds: a.selectedOptionIds || null,
        booleanValue: a.booleanValue ?? null,
      }),
    );
    await this.answerRepository.saveAll(answers);

    // Update response status
    if (!dto.isDraft) {
      response.status = SurveyResponseStatus.SUBMITTED;
      response.submittedAt = new Date();
      await this.responseRepository.save(response);

      // Update assignment
      assignment.status = SurveyResponseStatus.SUBMITTED;
      assignment.hasCompleted = true;
      assignment.completedAt = new Date();
      await this.assignmentRepository.save(assignment);
    }

    return this.responseRepository.findOne(response.id) as Promise<SurveyResponse>;
  }

  async getMyResponse(
    surveyId: string,
    employeeId: string,
  ): Promise<SurveyResponse | null> {
    const survey = await this.surveyRepository.findOne(surveyId);
    if (!survey) {
      throw new NotFoundException(`Survey with ID "${surveyId}" not found`);
    }

    if (survey.isAnonymous) {
      // For anonymous surveys, we can't retrieve by respondent
      return null;
    }

    return this.responseRepository.findBySurveyAndRespondent(surveyId, employeeId);
  }

  async getAllResponses(surveyId: string): Promise<SurveyResponse[]> {
    return this.responseRepository.findBySurvey(surveyId);
  }

  async getResponse(id: string): Promise<SurveyResponse> {
    const response = await this.responseRepository.findOne(id);
    if (!response) {
      throw new NotFoundException(`Survey response with ID "${id}" not found`);
    }
    return response;
  }
}
