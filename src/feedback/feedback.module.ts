import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
  FeedbackCategory,
  FeedbackItem,
  FeedbackMessage,
  FeedbackAttachment,
  FeedbackRequestTemplate,
  FeedbackRequest,
  FeedbackRequestAssignment,
  SurveyTemplate,
  SurveyQuestion,
  SurveyQuestionOption,
  Survey,
  SurveyAssignment,
  SurveyResponse,
  SurveyAnswer,
  Announcement,
  AnnouncementRecipient,
} from './entities';

import {
  TypeOrmFeedbackCategoryRepository,
  TypeOrmFeedbackItemRepository,
  TypeOrmFeedbackMessageRepository,
  TypeOrmFeedbackAttachmentRepository,
  TypeOrmFeedbackRequestTemplateRepository,
  TypeOrmFeedbackRequestRepository,
  TypeOrmFeedbackRequestAssignmentRepository,
} from './feedback.repository';

import {
  TypeOrmSurveyTemplateRepository,
  TypeOrmSurveyQuestionRepository,
  TypeOrmSurveyQuestionOptionRepository,
  TypeOrmSurveyRepository,
  TypeOrmSurveyAssignmentRepository,
  TypeOrmSurveyResponseRepository,
  TypeOrmSurveyAnswerRepository,
} from './survey.repository';

import {
  TypeOrmAnnouncementRepository,
  TypeOrmAnnouncementRecipientRepository,
} from './announcement.repository';

import { FeedbackCategoryService } from './services/feedback-category.service';
import { FeedbackItemService } from './services/feedback-item.service';
import { FeedbackRequestService } from './services/feedback-request.service';
import { SurveyTemplateService } from './services/survey-template.service';
import { SurveyService } from './services/survey.service';
import { SurveyResponseService } from './services/survey-response.service';
import { SurveyAnalyticsService } from './services/survey-analytics.service';
import { AnnouncementService } from './services/announcement.service';
import { AudienceTargetingService } from './services/audience-targeting.service';

import { FeedbackCategoryController } from './controllers/feedback-category.controller';
import { FeedbackItemController } from './controllers/feedback-item.controller';
import { FeedbackRequestController } from './controllers/feedback-request.controller';
import { SurveyTemplateController } from './controllers/survey-template.controller';
import { SurveyController } from './controllers/survey.controller';
import { SurveyResponseController } from './controllers/survey-response.controller';
import { AnnouncementController } from './controllers/announcement.controller';

import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FeedbackCategory,
      FeedbackItem,
      FeedbackMessage,
      FeedbackAttachment,
      FeedbackRequestTemplate,
      FeedbackRequest,
      FeedbackRequestAssignment,
      SurveyTemplate,
      SurveyQuestion,
      SurveyQuestionOption,
      Survey,
      SurveyAssignment,
      SurveyResponse,
      SurveyAnswer,
      Announcement,
      AnnouncementRecipient,
    ]),
    PermissionsModule,
  ],
  controllers: [
    FeedbackCategoryController,
    FeedbackItemController,
    FeedbackRequestController,
    SurveyTemplateController,
    SurveyController,
    SurveyResponseController,
    AnnouncementController,
  ],
  providers: [
    // Services
    FeedbackCategoryService,
    FeedbackItemService,
    FeedbackRequestService,
    SurveyTemplateService,
    SurveyService,
    SurveyResponseService,
    SurveyAnalyticsService,
    AnnouncementService,
    AudienceTargetingService,

    // Feedback Repositories
    {
      provide: 'FeedbackCategoryRepository',
      useClass: TypeOrmFeedbackCategoryRepository,
    },
    {
      provide: 'FeedbackItemRepository',
      useClass: TypeOrmFeedbackItemRepository,
    },
    {
      provide: 'FeedbackMessageRepository',
      useClass: TypeOrmFeedbackMessageRepository,
    },
    {
      provide: 'FeedbackAttachmentRepository',
      useClass: TypeOrmFeedbackAttachmentRepository,
    },
    {
      provide: 'FeedbackRequestTemplateRepository',
      useClass: TypeOrmFeedbackRequestTemplateRepository,
    },
    {
      provide: 'FeedbackRequestRepository',
      useClass: TypeOrmFeedbackRequestRepository,
    },
    {
      provide: 'FeedbackRequestAssignmentRepository',
      useClass: TypeOrmFeedbackRequestAssignmentRepository,
    },

    // Survey Repositories
    {
      provide: 'SurveyTemplateRepository',
      useClass: TypeOrmSurveyTemplateRepository,
    },
    {
      provide: 'SurveyQuestionRepository',
      useClass: TypeOrmSurveyQuestionRepository,
    },
    {
      provide: 'SurveyQuestionOptionRepository',
      useClass: TypeOrmSurveyQuestionOptionRepository,
    },
    {
      provide: 'SurveyRepository',
      useClass: TypeOrmSurveyRepository,
    },
    {
      provide: 'SurveyAssignmentRepository',
      useClass: TypeOrmSurveyAssignmentRepository,
    },
    {
      provide: 'SurveyResponseRepository',
      useClass: TypeOrmSurveyResponseRepository,
    },
    {
      provide: 'SurveyAnswerRepository',
      useClass: TypeOrmSurveyAnswerRepository,
    },

    // Announcement Repositories
    {
      provide: 'AnnouncementRepository',
      useClass: TypeOrmAnnouncementRepository,
    },
    {
      provide: 'AnnouncementRecipientRepository',
      useClass: TypeOrmAnnouncementRecipientRepository,
    },
  ],
  exports: [
    FeedbackCategoryService,
    FeedbackItemService,
    FeedbackRequestService,
    SurveyTemplateService,
    SurveyService,
    SurveyResponseService,
    SurveyAnalyticsService,
    AnnouncementService,
    AudienceTargetingService,
  ],
})
export class FeedbackModule {}
