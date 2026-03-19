import { INestApplicationContext, Logger } from '@nestjs/common';
import { Seeder } from '../seeder.interface';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyService } from '../../company/services/company.service';
import { UserService } from '../../user/user.service';
import { EmployeeService } from '../../employee/employee.service';

import {
  FeedbackCategory,
  FeedbackItem,
  FeedbackRequestTemplate,
  FeedbackRequest,
  FeedbackRequestAssignment,
  SurveyTemplate,
  SurveyQuestion,
  SurveyQuestionOption,
  Survey,
  SurveyAssignment,
  Announcement,
  AnnouncementRecipient,
} from '../../feedback/entities';

import {
  FeedbackSubmissionMode,
  FeedbackStatus,
  FeedbackSensitivity,
  FeedbackRequestStatus,
  FeedbackAssignmentStatus,
  QuestionType,
  SurveyStatus,
  SurveyRecurrence,
  SurveyResponseStatus,
  AnnouncementStatus,
  AnnouncementPriority,
  AudienceTargetType,
} from '../../feedback/enums';

export class FeedbackSeeder implements Seeder {
  private readonly logger = new Logger(FeedbackSeeder.name);

  async run(app: INestApplicationContext): Promise<void> {
    const userService = app.get(UserService);
    const companyService = app.get(CompanyService);
    const employeeService = app.get(EmployeeService);

    const categoryRepo = app.get<Repository<FeedbackCategory>>(
      getRepositoryToken(FeedbackCategory),
    );
    const feedbackItemRepo = app.get<Repository<FeedbackItem>>(
      getRepositoryToken(FeedbackItem),
    );
    const templateRepo = app.get<Repository<FeedbackRequestTemplate>>(
      getRepositoryToken(FeedbackRequestTemplate),
    );
    const requestRepo = app.get<Repository<FeedbackRequest>>(
      getRepositoryToken(FeedbackRequest),
    );
    const assignmentRepo = app.get<Repository<FeedbackRequestAssignment>>(
      getRepositoryToken(FeedbackRequestAssignment),
    );
    const surveyTemplateRepo = app.get<Repository<SurveyTemplate>>(
      getRepositoryToken(SurveyTemplate),
    );
    const surveyQuestionRepo = app.get<Repository<SurveyQuestion>>(
      getRepositoryToken(SurveyQuestion),
    );
    const surveyQuestionOptionRepo = app.get<Repository<SurveyQuestionOption>>(
      getRepositoryToken(SurveyQuestionOption),
    );
    const surveyRepo = app.get<Repository<Survey>>(getRepositoryToken(Survey));
    const surveyAssignmentRepo = app.get<Repository<SurveyAssignment>>(
      getRepositoryToken(SurveyAssignment),
    );
    const announcementRepo = app.get<Repository<Announcement>>(
      getRepositoryToken(Announcement),
    );
    const announcementRecipientRepo = app.get<Repository<AnnouncementRecipient>>(
      getRepositoryToken(AnnouncementRecipient),
    );

    // Find admin user and company
    const users = await userService.findAll();
    const admin = users.find((u: any) => u.email === 'admin@admin.com');
    if (!admin) {
      this.logger.warn('Admin user not found — skipping feedback seed.');
      return;
    }

    const company = await companyService.findByOwner(admin.id);
    if (!company) {
      this.logger.warn('Admin company not found — skipping feedback seed.');
      return;
    }

    // Check if already seeded
    const existingCategory = await categoryRepo.findOne({
      where: { companyId: company.id, code: 'suggestion' },
    });
    if (existingCategory) {
      this.logger.log('Feedback data already exists — skipping.');
      return;
    }

    // Get employees for sample data
    const employees = await employeeService.findAll();
    const firstEmployee = employees[0];

    // ── 1. Create Feedback Categories ──
    const categories = [
      {
        code: 'suggestion',
        name: 'Suggestion',
        description: 'Ideas and suggestions for improvement',
        color: '#10B981',
        icon: 'lightbulb',
        sortOrder: 1,
        allowAnonymous: true,
        allowConfidential: true,
      },
      {
        code: 'concern',
        name: 'Concern',
        description: 'General workplace concerns',
        color: '#F59E0B',
        icon: 'alert-circle',
        sortOrder: 2,
        allowAnonymous: true,
        allowConfidential: true,
      },
      {
        code: 'complaint',
        name: 'Complaint',
        description: 'Formal complaints about workplace issues',
        color: '#EF4444',
        icon: 'alert-triangle',
        sortOrder: 3,
        allowAnonymous: true,
        allowConfidential: true,
        isSensitive: true,
      },
      {
        code: 'recognition',
        name: 'Recognition',
        description: 'Recognize colleagues for great work',
        color: '#8B5CF6',
        icon: 'star',
        sortOrder: 4,
        allowAnonymous: false,
        allowConfidential: false,
      },
      {
        code: 'manager_feedback',
        name: 'Manager Feedback',
        description: 'Feedback about management',
        color: '#3B82F6',
        icon: 'user',
        sortOrder: 5,
        allowAnonymous: true,
        allowConfidential: true,
        isSensitive: true,
      },
      {
        code: 'workplace_issue',
        name: 'Workplace Issue',
        description: 'Issues related to facilities, equipment, or environment',
        color: '#6366F1',
        icon: 'building',
        sortOrder: 6,
        allowAnonymous: true,
        allowConfidential: false,
      },
      {
        code: 'policy_feedback',
        name: 'Policy Feedback',
        description: 'Feedback about company policies and processes',
        color: '#0EA5E9',
        icon: 'file-text',
        sortOrder: 7,
        allowAnonymous: true,
        allowConfidential: false,
      },
      {
        code: 'harassment',
        name: 'Harassment',
        description: 'Report harassment or misconduct',
        color: '#DC2626',
        icon: 'shield-alert',
        sortOrder: 8,
        allowAnonymous: true,
        allowConfidential: true,
        isSensitive: true,
        restrictedVisibility: true,
      },
    ];

    const createdCategories: Record<string, FeedbackCategory> = {};
    for (const catData of categories) {
      const category = categoryRepo.create({
        companyId: company.id,
        ...catData,
        isActive: true,
      });
      const saved = await categoryRepo.save(category);
      createdCategories[catData.code] = saved;
      this.logger.log(`Created feedback category: ${catData.name}`);
    }

    // ── 2. Create Sample Feedback Items ──
    if (firstEmployee) {
      // Identified suggestion
      await feedbackItemRepo.save(
        feedbackItemRepo.create({
          companyId: company.id,
          categoryId: createdCategories['suggestion'].id,
          submittedById: firstEmployee.id,
          submissionMode: FeedbackSubmissionMode.IDENTIFIED,
          subject: 'Flexible Working Hours Proposal',
          body: 'I would like to suggest implementing flexible working hours. This would help employees balance work and personal commitments better, potentially improving productivity and job satisfaction.',
          status: FeedbackStatus.SUBMITTED,
          sensitivity: FeedbackSensitivity.NORMAL,
        }),
      );
      this.logger.log('Created sample feedback: Flexible Working Hours');

      // Anonymous workplace issue
      await feedbackItemRepo.save(
        feedbackItemRepo.create({
          companyId: company.id,
          categoryId: createdCategories['workplace_issue'].id,
          submittedById: null, // Anonymous
          submissionMode: FeedbackSubmissionMode.ANONYMOUS,
          subject: 'Office Temperature Issues',
          body: 'The office temperature has been inconsistent lately. Some areas are too cold while others are too warm. Could we look into the HVAC system?',
          status: FeedbackStatus.RECEIVED,
          sensitivity: FeedbackSensitivity.NORMAL,
        }),
      );
      this.logger.log('Created sample anonymous feedback: Office Temperature');

      // Confidential concern
      await feedbackItemRepo.save(
        feedbackItemRepo.create({
          companyId: company.id,
          categoryId: createdCategories['concern'].id,
          submittedById: firstEmployee.id,
          submissionMode: FeedbackSubmissionMode.CONFIDENTIAL,
          subject: 'Team Dynamics Concern',
          body: 'I have noticed some tension within our team that I believe needs to be addressed. I would appreciate a confidential discussion about this matter.',
          status: FeedbackStatus.UNDER_REVIEW,
          sensitivity: FeedbackSensitivity.SENSITIVE,
        }),
      );
      this.logger.log('Created sample confidential feedback: Team Dynamics');
    }

    // ── 3. Create Feedback Request Templates ──
    const templates = [
      {
        code: 'onboarding_feedback',
        name: 'New Hire Onboarding Feedback',
        description:
          'Template for collecting feedback from new employees about their onboarding experience',
        title: 'How was your onboarding experience?',
        instructions:
          'Please share your thoughts on your onboarding experience. Your feedback helps us improve the process for future new hires.',
        defaultSubmissionMode: FeedbackSubmissionMode.IDENTIFIED,
        categoryId: createdCategories['suggestion'].id,
        defaultDueDays: 14,
      },
      {
        code: 'exit_feedback',
        name: 'Exit Interview Feedback',
        description:
          'Template for collecting feedback from departing employees',
        title: 'Exit Interview Feedback',
        instructions:
          'As you prepare to leave, we would value your honest feedback about your experience working here.',
        defaultSubmissionMode: FeedbackSubmissionMode.CONFIDENTIAL,
        categoryId: createdCategories['policy_feedback'].id,
        defaultDueDays: 7,
      },
      {
        code: 'quarterly_pulse',
        name: 'Quarterly Pulse Check',
        description: 'Quick quarterly feedback request',
        title: 'Quarterly Pulse Check',
        instructions:
          'Help us understand how things are going. This is a brief check-in to hear your thoughts.',
        defaultSubmissionMode: FeedbackSubmissionMode.ANONYMOUS,
        categoryId: createdCategories['suggestion'].id,
        defaultDueDays: 7,
      },
    ];

    for (const tplData of templates) {
      await templateRepo.save(
        templateRepo.create({
          companyId: company.id,
          ...tplData,
          isActive: true,
        }),
      );
      this.logger.log(`Created feedback request template: ${tplData.name}`);
    }

    // ── 4. Create Sample Feedback Request ──
    if (firstEmployee) {
      const request = await requestRepo.save(
        requestRepo.create({
          companyId: company.id,
          title: 'Remote Work Experience Feedback',
          instructions:
            'Please share your feedback about working remotely. We want to understand what is working well and what could be improved.',
          categoryId: createdCategories['suggestion'].id,
          submissionMode: FeedbackSubmissionMode.IDENTIFIED,
          isMandatory: false,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
          audienceType: AudienceTargetType.ALL_EMPLOYEES,
          status: FeedbackRequestStatus.ACTIVE,
          createdByUserId: admin.id,
          activatedAt: new Date(),
        }),
      );

      // Create assignment for first employee
      await assignmentRepo.save(
        assignmentRepo.create({
          feedbackRequestId: request.id,
          employeeId: firstEmployee.id,
          status: FeedbackAssignmentStatus.PENDING,
        }),
      );
      this.logger.log('Created sample feedback request: Remote Work Experience');
    }

    // ── 5. Create Survey Templates ──
    const engagementTemplate = await surveyTemplateRepo.save(
      surveyTemplateRepo.create({
        companyId: company.id,
        name: 'Employee Engagement Survey',
        description:
          'Comprehensive survey to measure employee engagement levels',
        defaultTitle: 'Annual Employee Engagement Survey',
        defaultInstructions:
          'Please take a few minutes to complete this survey. Your responses help us understand and improve the employee experience.',
        defaultAnonymous: true,
        category: 'engagement',
        isActive: true,
      }),
    );

    // Add questions to engagement template
    const engagementQuestions = [
      {
        questionType: QuestionType.SECTION_HEADER,
        questionText: 'Overall Satisfaction',
        sortOrder: 0,
      },
      {
        questionType: QuestionType.RATING_1_10,
        questionText: 'How satisfied are you with your job overall?',
        helpText: '1 = Very dissatisfied, 10 = Very satisfied',
        isRequired: true,
        sortOrder: 1,
      },
      {
        questionType: QuestionType.RATING_1_5,
        questionText:
          'How likely are you to recommend this company as a great place to work?',
        helpText: '1 = Not at all likely, 5 = Extremely likely',
        isRequired: true,
        sortOrder: 2,
      },
      {
        questionType: QuestionType.SINGLE_SELECT,
        questionText: 'How long have you been with the company?',
        isRequired: true,
        sortOrder: 3,
        options: [
          { value: 'less_than_1', label: 'Less than 1 year', sortOrder: 0 },
          { value: '1_to_3', label: '1-3 years', sortOrder: 1 },
          { value: '3_to_5', label: '3-5 years', sortOrder: 2 },
          { value: 'more_than_5', label: 'More than 5 years', sortOrder: 3 },
        ],
      },
      {
        questionType: QuestionType.SECTION_HEADER,
        questionText: 'Work Environment',
        sortOrder: 4,
      },
      {
        questionType: QuestionType.YES_NO,
        questionText: 'Do you have the tools and resources you need to do your job effectively?',
        isRequired: true,
        sortOrder: 5,
      },
      {
        questionType: QuestionType.MULTI_SELECT,
        questionText: 'Which aspects of the work environment are most important to you?',
        sortOrder: 6,
        options: [
          { value: 'flexibility', label: 'Flexible working hours', sortOrder: 0 },
          { value: 'remote', label: 'Remote work options', sortOrder: 1 },
          { value: 'office', label: 'Modern office facilities', sortOrder: 2 },
          { value: 'team', label: 'Collaborative team culture', sortOrder: 3 },
          { value: 'growth', label: 'Career growth opportunities', sortOrder: 4 },
        ],
      },
      {
        questionType: QuestionType.LONG_TEXT,
        questionText:
          'What is one thing we could do to improve your work experience?',
        sortOrder: 7,
      },
    ];

    for (const q of engagementQuestions) {
      const options = q.options;
      delete (q as any).options;

      const question = await surveyQuestionRepo.save(
        surveyQuestionRepo.create({
          surveyTemplateId: engagementTemplate.id,
          ...q,
        }),
      );

      if (options) {
        for (const opt of options) {
          await surveyQuestionOptionRepo.save(
            surveyQuestionOptionRepo.create({
              questionId: question.id,
              ...opt,
            }),
          );
        }
      }
    }
    this.logger.log('Created survey template: Employee Engagement Survey');

    // Create Onboarding Survey Template
    const onboardingTemplate = await surveyTemplateRepo.save(
      surveyTemplateRepo.create({
        companyId: company.id,
        name: 'New Hire Onboarding Survey',
        description: 'Survey for new employees after their first 30 days',
        defaultTitle: '30-Day Onboarding Survey',
        defaultInstructions:
          'Please share your feedback about your onboarding experience.',
        defaultAnonymous: false,
        category: 'onboarding',
        isActive: true,
      }),
    );

    const onboardingQuestions = [
      {
        questionType: QuestionType.RATING_1_5,
        questionText: 'How would you rate your overall onboarding experience?',
        isRequired: true,
        sortOrder: 0,
      },
      {
        questionType: QuestionType.YES_NO,
        questionText: 'Did you receive all the equipment you needed on your first day?',
        isRequired: true,
        sortOrder: 1,
      },
      {
        questionType: QuestionType.RATING_1_5,
        questionText: 'How well did your manager support your onboarding?',
        isRequired: true,
        sortOrder: 2,
      },
      {
        questionType: QuestionType.SHORT_TEXT,
        questionText: 'What was the best part of your onboarding?',
        sortOrder: 3,
      },
      {
        questionType: QuestionType.LONG_TEXT,
        questionText: 'What could we improve about the onboarding process?',
        sortOrder: 4,
      },
    ];

    for (const q of onboardingQuestions) {
      await surveyQuestionRepo.save(
        surveyQuestionRepo.create({
          surveyTemplateId: onboardingTemplate.id,
          ...q,
        }),
      );
    }
    this.logger.log('Created survey template: New Hire Onboarding Survey');

    // ── 6. Create a Sample Published Survey ──
    if (firstEmployee) {
      const survey = await surveyRepo.save(
        surveyRepo.create({
          companyId: company.id,
          templateId: engagementTemplate.id,
          title: 'Q4 2024 Employee Engagement Survey',
          description:
            'Help us understand your experience and improve our workplace.',
          isAnonymous: true,
          isMandatory: true,
          allowEditUntilDue: true,
          startDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          recurrence: SurveyRecurrence.ONCE,
          audienceType: AudienceTargetType.ALL_EMPLOYEES,
          anonymityThreshold: 5,
          status: SurveyStatus.ACTIVE,
          publishedAt: new Date(),
          createdByUserId: admin.id,
        }),
      );

      // Copy questions from template to survey
      const templateQuestions = await surveyQuestionRepo.find({
        where: { surveyTemplateId: engagementTemplate.id },
        relations: ['options'],
        order: { sortOrder: 'ASC' },
      });

      for (const tplQ of templateQuestions) {
        const newQuestion = await surveyQuestionRepo.save(
          surveyQuestionRepo.create({
            surveyId: survey.id,
            questionType: tplQ.questionType,
            questionText: tplQ.questionText,
            helpText: tplQ.helpText,
            isRequired: tplQ.isRequired,
            sortOrder: tplQ.sortOrder,
            section: tplQ.section,
            config: tplQ.config,
          }),
        );

        if (tplQ.options?.length) {
          for (const opt of tplQ.options) {
            await surveyQuestionOptionRepo.save(
              surveyQuestionOptionRepo.create({
                questionId: newQuestion.id,
                value: opt.value,
                label: opt.label,
                sortOrder: opt.sortOrder,
              }),
            );
          }
        }
      }

      // Create assignment
      await surveyAssignmentRepo.save(
        surveyAssignmentRepo.create({
          surveyId: survey.id,
          employeeId: firstEmployee.id,
          status: SurveyResponseStatus.NOT_STARTED,
          hasCompleted: false,
        }),
      );
      this.logger.log('Created sample survey: Q4 2024 Employee Engagement');
    }

    // ── 7. Create Sample Announcements ──
    const announcements = [
      {
        title: 'Welcome to Q4 2024!',
        summary: 'Key updates and priorities for the quarter',
        body: `
<p>Dear Team,</p>
<p>As we enter Q4 2024, I wanted to share some exciting updates and our priorities for the coming months:</p>
<ul>
  <li><strong>New Office Expansion:</strong> We're thrilled to announce the opening of our new office space on the 5th floor.</li>
  <li><strong>Holiday Schedule:</strong> Please check the updated holiday calendar for the end-of-year break schedule.</li>
  <li><strong>Annual Reviews:</strong> Performance reviews will begin in November. Please prepare your self-assessments.</li>
</ul>
<p>Thank you for your continued dedication!</p>
<p>Best regards,<br>Leadership Team</p>
        `.trim(),
        priority: AnnouncementPriority.NORMAL,
        isPinned: true,
        requiresAcknowledgment: false,
        status: AnnouncementStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      {
        title: 'Updated Remote Work Policy',
        summary: 'Important policy changes effective immediately',
        body: `
<p>Dear Colleagues,</p>
<p>We have updated our remote work policy based on your feedback. Key changes include:</p>
<ul>
  <li>Increased flexibility for remote work days</li>
  <li>New equipment allowance for home office setup</li>
  <li>Updated guidelines for hybrid meetings</li>
</ul>
<p>Please read the full policy document and acknowledge that you have reviewed these changes.</p>
        `.trim(),
        priority: AnnouncementPriority.IMPORTANT,
        isPinned: false,
        requiresAcknowledgment: true,
        acknowledgmentDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: AnnouncementStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      {
        title: 'System Maintenance Notice',
        summary: 'Planned maintenance this weekend',
        body: `
<p>Please be advised that our systems will undergo scheduled maintenance this weekend.</p>
<p><strong>Maintenance Window:</strong> Saturday, 10 PM - Sunday, 6 AM</p>
<p>During this time, access to internal systems may be limited. Please plan accordingly.</p>
        `.trim(),
        priority: AnnouncementPriority.CRITICAL,
        isPinned: false,
        requiresAcknowledgment: false,
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: AnnouncementStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    ];

    for (const annData of announcements) {
      const announcement = await announcementRepo.save(
        announcementRepo.create({
          companyId: company.id,
          createdByUserId: admin.id,
          audienceType: AudienceTargetType.ALL_EMPLOYEES,
          ...annData,
        }),
      );

      // Create recipient for first employee
      if (firstEmployee) {
        await announcementRecipientRepo.save(
          announcementRecipientRepo.create({
            announcementId: announcement.id,
            employeeId: firstEmployee.id,
            hasRead: false,
            hasAcknowledged: false,
          }),
        );
      }

      this.logger.log(`Created announcement: ${annData.title}`);
    }

    // Create a draft announcement
    await announcementRepo.save(
      announcementRepo.create({
        companyId: company.id,
        createdByUserId: admin.id,
        title: 'Year-End Party Announcement',
        summary: 'Save the date!',
        body: '<p>Details coming soon about our annual year-end celebration!</p>',
        priority: AnnouncementPriority.NORMAL,
        isPinned: false,
        requiresAcknowledgment: false,
        audienceType: AudienceTargetType.ALL_EMPLOYEES,
        status: AnnouncementStatus.DRAFT,
      }),
    );
    this.logger.log('Created draft announcement: Year-End Party');

    this.logger.log('Feedback seeding completed successfully.');
  }
}
