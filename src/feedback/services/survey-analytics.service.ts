import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  SurveyRepository,
  SurveyResponseRepository,
  SurveyAnswerRepository,
  SurveyQuestionRepository,
  SurveyAssignmentRepository,
} from '../survey.repository';
import { QuestionType, SurveyResponseStatus } from '../enums';

export interface QuestionAnalytics {
  questionId: string;
  questionText: string;
  questionType: QuestionType;
  totalResponses: number;
  // For rating/scale questions
  averageRating?: number;
  ratingDistribution?: Record<number, number>;
  // For select questions
  optionDistribution?: Array<{
    optionId: string;
    label: string;
    count: number;
    percentage: number;
  }>;
  // For yes/no questions
  yesCount?: number;
  noCount?: number;
  // For text questions
  textResponses?: string[]; // Only if above threshold
  suppressed?: boolean; // True if below anonymity threshold
}

export interface SurveyAnalytics {
  surveyId: string;
  title: string;
  totalAssigned: number;
  totalCompleted: number;
  completionRate: number;
  anonymityThreshold: number;
  questionAnalytics: QuestionAnalytics[];
  belowThreshold: boolean;
}

@Injectable()
export class SurveyAnalyticsService {
  constructor(
    @Inject('SurveyRepository')
    private readonly surveyRepository: SurveyRepository,

    @Inject('SurveyResponseRepository')
    private readonly responseRepository: SurveyResponseRepository,

    @Inject('SurveyAnswerRepository')
    private readonly answerRepository: SurveyAnswerRepository,

    @Inject('SurveyQuestionRepository')
    private readonly questionRepository: SurveyQuestionRepository,

    @Inject('SurveyAssignmentRepository')
    private readonly assignmentRepository: SurveyAssignmentRepository,
  ) {}

  async getSurveyAnalytics(surveyId: string): Promise<SurveyAnalytics> {
    const survey = await this.surveyRepository.findOne(surveyId);
    if (!survey) {
      throw new NotFoundException(`Survey with ID "${surveyId}" not found`);
    }

    const totalAssigned = await this.assignmentRepository.countBySurvey(surveyId);
    const totalCompleted = await this.assignmentRepository.countBySurveyAndStatus(
      surveyId,
      SurveyResponseStatus.SUBMITTED,
    );

    const belowThreshold = totalCompleted < survey.anonymityThreshold;

    const questions = await this.questionRepository.findBySurvey(surveyId);
    const responses = await this.responseRepository.findBySurvey(surveyId);

    const questionAnalytics: QuestionAnalytics[] = [];

    for (const question of questions) {
      // Skip section headers
      if (question.questionType === QuestionType.SECTION_HEADER) {
        continue;
      }

      const answersForQuestion = responses
        .flatMap((r) => r.answers || [])
        .filter((a) => a.questionId === question.id);

      const analytics: QuestionAnalytics = {
        questionId: question.id,
        questionText: question.questionText,
        questionType: question.questionType,
        totalResponses: answersForQuestion.length,
        suppressed: belowThreshold,
      };

      // Only calculate detailed analytics if above threshold
      if (!belowThreshold) {
        switch (question.questionType) {
          case QuestionType.RATING_1_5:
          case QuestionType.RATING_1_10:
          case QuestionType.OPINION_SCALE:
            const numericAnswers = answersForQuestion
              .filter((a) => a.numericValue !== null)
              .map((a) => a.numericValue!);

            if (numericAnswers.length > 0) {
              analytics.averageRating =
                numericAnswers.reduce((a, b) => a + b, 0) / numericAnswers.length;

              const distribution: Record<number, number> = {};
              for (const val of numericAnswers) {
                distribution[val] = (distribution[val] || 0) + 1;
              }
              analytics.ratingDistribution = distribution;
            }
            break;

          case QuestionType.SINGLE_SELECT:
            const singleSelectDistribution = new Map<string, number>();
            for (const answer of answersForQuestion) {
              if (answer.selectedOptionId) {
                const count = singleSelectDistribution.get(answer.selectedOptionId) || 0;
                singleSelectDistribution.set(answer.selectedOptionId, count + 1);
              }
            }
            analytics.optionDistribution = question.options?.map((opt) => ({
              optionId: opt.id,
              label: opt.label,
              count: singleSelectDistribution.get(opt.id) || 0,
              percentage:
                answersForQuestion.length > 0
                  ? Math.round(
                      ((singleSelectDistribution.get(opt.id) || 0) /
                        answersForQuestion.length) *
                        100,
                    )
                  : 0,
            }));
            break;

          case QuestionType.MULTI_SELECT:
            const multiSelectDistribution = new Map<string, number>();
            for (const answer of answersForQuestion) {
              if (answer.selectedOptionIds?.length) {
                for (const optId of answer.selectedOptionIds) {
                  const count = multiSelectDistribution.get(optId) || 0;
                  multiSelectDistribution.set(optId, count + 1);
                }
              }
            }
            analytics.optionDistribution = question.options?.map((opt) => ({
              optionId: opt.id,
              label: opt.label,
              count: multiSelectDistribution.get(opt.id) || 0,
              percentage:
                answersForQuestion.length > 0
                  ? Math.round(
                      ((multiSelectDistribution.get(opt.id) || 0) /
                        answersForQuestion.length) *
                        100,
                    )
                  : 0,
            }));
            break;

          case QuestionType.YES_NO:
            analytics.yesCount = answersForQuestion.filter(
              (a) => a.booleanValue === true,
            ).length;
            analytics.noCount = answersForQuestion.filter(
              (a) => a.booleanValue === false,
            ).length;
            break;

          case QuestionType.SHORT_TEXT:
          case QuestionType.LONG_TEXT:
            analytics.textResponses = answersForQuestion
              .filter((a) => a.textValue)
              .map((a) => a.textValue!);
            break;
        }
      }

      questionAnalytics.push(analytics);
    }

    return {
      surveyId: survey.id,
      title: survey.title,
      totalAssigned,
      totalCompleted,
      completionRate:
        totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0,
      anonymityThreshold: survey.anonymityThreshold,
      questionAnalytics,
      belowThreshold,
    };
  }

  async getParticipationMetrics(surveyId: string): Promise<{
    total: number;
    notStarted: number;
    inProgress: number;
    completed: number;
    overdue: number;
  }> {
    const survey = await this.surveyRepository.findOne(surveyId);
    if (!survey) {
      throw new NotFoundException(`Survey with ID "${surveyId}" not found`);
    }

    const assignments = await this.assignmentRepository.findBySurvey(surveyId);
    const now = new Date();
    const isDueDatePassed = survey.dueDate && now > survey.dueDate;

    const total = assignments.length;
    const completed = assignments.filter(
      (a) => a.status === SurveyResponseStatus.SUBMITTED,
    ).length;
    const inProgress = assignments.filter(
      (a) => a.status === SurveyResponseStatus.IN_PROGRESS,
    ).length;
    const notStarted = assignments.filter(
      (a) => a.status === SurveyResponseStatus.NOT_STARTED,
    ).length;

    const overdue = isDueDatePassed
      ? assignments.filter(
          (a) => a.status !== SurveyResponseStatus.SUBMITTED,
        ).length
      : 0;

    return { total, notStarted, inProgress, completed, overdue };
  }
}
