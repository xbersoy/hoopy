import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SurveyService } from './survey.service';
import { SurveyStatus, SurveyRecurrence, SurveyResponseStatus, QuestionType } from '../enums';

describe('SurveyService', () => {
  let service: SurveyService;

  const mockSurveyRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findPaginated: jest.fn(),
    remove: jest.fn(),
  };

  const mockQuestionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    deleteBySurveyId: jest.fn(),
  };

  const mockOptionRepository = {
    create: jest.fn(),
    saveAll: jest.fn(),
  };

  const mockAssignmentRepository = {
    create: jest.fn(),
    saveAll: jest.fn(),
    findBySurvey: jest.fn(),
    findByEmployee: jest.fn(),
    findPendingByEmployee: jest.fn(),
    countBySurvey: jest.fn(),
    countBySurveyAndStatus: jest.fn(),
  };

  const mockTemplateRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SurveyService,
        {
          provide: 'SurveyRepository',
          useValue: mockSurveyRepository,
        },
        {
          provide: 'SurveyQuestionRepository',
          useValue: mockQuestionRepository,
        },
        {
          provide: 'SurveyQuestionOptionRepository',
          useValue: mockOptionRepository,
        },
        {
          provide: 'SurveyAssignmentRepository',
          useValue: mockAssignmentRepository,
        },
        {
          provide: 'SurveyTemplateRepository',
          useValue: mockTemplateRepository,
        },
      ],
    }).compile();

    service = module.get<SurveyService>(SurveyService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const companyId = 'company-123';
    const userId = 'user-456';

    it('should create a new survey in DRAFT status', async () => {
      const createDto = {
        title: 'Employee Satisfaction Survey',
        description: 'Annual survey',
        isAnonymous: true,
        isMandatory: false,
      };

      mockSurveyRepository.create.mockReturnValue({ id: 'survey-1' });
      mockSurveyRepository.save.mockResolvedValue({ id: 'survey-1' });
      mockSurveyRepository.findOne.mockResolvedValue({
        id: 'survey-1',
        ...createDto,
        status: SurveyStatus.DRAFT,
      });

      const result = await service.create(companyId, userId, createDto);

      expect(mockSurveyRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId,
          createdByUserId: userId,
          status: SurveyStatus.DRAFT,
        }),
      );
      expect(result.status).toBe(SurveyStatus.DRAFT);
    });

    it('should create survey with questions', async () => {
      const createDto = {
        title: 'Test Survey',
        questions: [
          {
            questionType: QuestionType.SINGLE_SELECT,
            questionText: 'How satisfied are you?',
            isRequired: true,
            sortOrder: 0,
            options: [
              { value: 'very', label: 'Very Satisfied', sortOrder: 0 },
              { value: 'somewhat', label: 'Somewhat Satisfied', sortOrder: 1 },
            ],
          },
        ],
      };

      mockSurveyRepository.create.mockReturnValue({ id: 'survey-1' });
      mockSurveyRepository.save.mockResolvedValue({ id: 'survey-1' });
      mockQuestionRepository.create.mockReturnValue({ id: 'q-1' });
      mockQuestionRepository.save.mockResolvedValue({ id: 'q-1' });
      mockOptionRepository.create.mockReturnValue({ id: 'opt-1' });
      mockSurveyRepository.findOne.mockResolvedValue({
        id: 'survey-1',
        questions: [{ id: 'q-1' }],
      });

      await service.create(companyId, userId, createDto);

      expect(mockQuestionRepository.create).toHaveBeenCalled();
      expect(mockQuestionRepository.save).toHaveBeenCalled();
      expect(mockOptionRepository.create).toHaveBeenCalledTimes(2);
      expect(mockOptionRepository.saveAll).toHaveBeenCalled();
    });

    it('should copy questions from template when templateId is provided', async () => {
      const createDto = {
        title: 'Survey from Template',
        templateId: 'template-1',
      };

      const templateWithQuestions = {
        id: 'template-1',
        questions: [
          {
            questionType: QuestionType.YES_NO,
            questionText: 'Do you agree?',
            isRequired: true,
            sortOrder: 0,
          },
        ],
      };

      mockTemplateRepository.findOne.mockResolvedValue(templateWithQuestions);
      mockSurveyRepository.create.mockReturnValue({ id: 'survey-1' });
      mockSurveyRepository.save.mockResolvedValue({ id: 'survey-1' });
      mockQuestionRepository.create.mockReturnValue({ id: 'q-1' });
      mockQuestionRepository.save.mockResolvedValue({ id: 'q-1' });
      mockSurveyRepository.findOne.mockResolvedValue({ id: 'survey-1' });

      await service.create(companyId, userId, createDto);

      expect(mockTemplateRepository.findOne).toHaveBeenCalledWith('template-1');
      expect(mockQuestionRepository.create).toHaveBeenCalled();
    });

    it('should set default anonymity threshold to 5', async () => {
      mockSurveyRepository.create.mockReturnValue({ id: 'survey-1' });
      mockSurveyRepository.save.mockResolvedValue({ id: 'survey-1' });
      mockSurveyRepository.findOne.mockResolvedValue({ id: 'survey-1' });

      await service.create(companyId, userId, { title: 'Test' });

      expect(mockSurveyRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          anonymityThreshold: 5,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated surveys', async () => {
      const mockData = [{ id: 'survey-1' }, { id: 'survey-2' }];
      mockSurveyRepository.findPaginated.mockResolvedValue({
        data: mockData,
        total: 25,
      });

      const result = await service.findAll('company-123', {
        page: 2,
        limit: 10,
      });

      expect(result.data).toEqual(mockData);
      expect(result.total).toBe(25);
      expect(result.page).toBe(2);
    });

    it('should use defaults for missing pagination params', async () => {
      mockSurveyRepository.findPaginated.mockResolvedValue({
        data: [],
        total: 0,
      });

      const result = await service.findAll('company-123', {});

      expect(mockSurveyRepository.findPaginated).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 10 }),
      );
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });

  describe('findOne', () => {
    it('should return survey when found', async () => {
      const mockSurvey = { id: 'survey-1', title: 'Test Survey' };
      mockSurveyRepository.findOne.mockResolvedValue(mockSurvey);

      const result = await service.findOne('survey-1');

      expect(result).toEqual(mockSurvey);
    });

    it('should throw NotFoundException when survey not found', async () => {
      mockSurveyRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const draftSurvey = {
      id: 'survey-1',
      title: 'Draft Survey',
      status: SurveyStatus.DRAFT,
    };

    beforeEach(() => {
      mockSurveyRepository.findOne.mockResolvedValue({ ...draftSurvey });
    });

    it('should update draft survey fields', async () => {
      mockSurveyRepository.save.mockResolvedValue({ ...draftSurvey, title: 'Updated' });

      await service.update('survey-1', { title: 'Updated Title' });

      expect(mockSurveyRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when updating non-draft survey', async () => {
      mockSurveyRepository.findOne.mockResolvedValue({
        ...draftSurvey,
        status: SurveyStatus.ACTIVE,
      });

      await expect(
        service.update('survey-1', { title: 'Updated' }),
      ).rejects.toThrow('Can only edit draft surveys');
    });

    it('should replace questions when provided', async () => {
      mockSurveyRepository.save.mockResolvedValue(draftSurvey);
      mockQuestionRepository.create.mockReturnValue({ id: 'q-1' });
      mockQuestionRepository.save.mockResolvedValue({ id: 'q-1' });

      await service.update('survey-1', {
        questions: [
          {
            questionType: QuestionType.SHORT_TEXT,
            questionText: 'New question',
          },
        ],
      });

      expect(mockQuestionRepository.deleteBySurveyId).toHaveBeenCalledWith('survey-1');
      expect(mockQuestionRepository.create).toHaveBeenCalled();
    });
  });

  describe('publish', () => {
    const draftSurveyWithQuestions = {
      id: 'survey-1',
      status: SurveyStatus.DRAFT,
      questions: [{ id: 'q-1', questionText: 'Test?' }],
    };

    it('should publish survey and create assignments', async () => {
      mockSurveyRepository.findOne.mockResolvedValue(draftSurveyWithQuestions);
      mockAssignmentRepository.create.mockReturnValue({ id: 'assign-1' });
      mockAssignmentRepository.saveAll.mockResolvedValue([]);
      mockSurveyRepository.save.mockImplementation((s) => s);

      const result = await service.publish('survey-1', ['emp-1', 'emp-2']);

      expect(result.status).toBe(SurveyStatus.ACTIVE);
      expect(result.publishedAt).toBeInstanceOf(Date);
      expect(mockAssignmentRepository.create).toHaveBeenCalledTimes(2);
      expect(mockAssignmentRepository.saveAll).toHaveBeenCalled();
    });

    it('should throw BadRequestException when publishing non-draft survey', async () => {
      mockSurveyRepository.findOne.mockResolvedValue({
        ...draftSurveyWithQuestions,
        status: SurveyStatus.ACTIVE,
      });

      await expect(
        service.publish('survey-1', ['emp-1']),
      ).rejects.toThrow('Can only publish draft surveys');
    });

    it('should throw BadRequestException when survey has no questions', async () => {
      mockSurveyRepository.findOne.mockResolvedValue({
        id: 'survey-1',
        status: SurveyStatus.DRAFT,
        questions: [],
      });

      await expect(
        service.publish('survey-1', ['emp-1']),
      ).rejects.toThrow('Survey must have at least one question');
    });

    it('should throw BadRequestException when no employees provided', async () => {
      mockSurveyRepository.findOne.mockResolvedValue({
        id: 'survey-1',
        status: SurveyStatus.DRAFT,
        questions: [{ id: 'q-1' }],
      });

      await expect(service.publish('survey-1', [])).rejects.toThrow(
        'At least one employee must be assigned',
      );
    });

    it('should create assignments with NOT_STARTED status', async () => {
      mockSurveyRepository.findOne.mockResolvedValue({
        id: 'survey-1',
        status: SurveyStatus.DRAFT,
        questions: [{ id: 'q-1', questionText: 'Test?' }],
      });
      mockAssignmentRepository.create.mockImplementation((data) => data);
      mockAssignmentRepository.saveAll.mockResolvedValue([]);
      mockSurveyRepository.save.mockImplementation((s) => s);

      await service.publish('survey-1', ['emp-1']);

      expect(mockAssignmentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: SurveyResponseStatus.NOT_STARTED,
          hasCompleted: false,
        }),
      );
    });
  });

  describe('schedule', () => {
    it('should schedule a draft survey', async () => {
      mockSurveyRepository.findOne.mockResolvedValue({
        id: 'survey-1',
        status: SurveyStatus.DRAFT,
      });
      mockSurveyRepository.save.mockImplementation((s) => s);

      const publishAt = new Date('2025-06-01');
      const result = await service.schedule('survey-1', publishAt);

      expect(result.status).toBe(SurveyStatus.SCHEDULED);
      expect(result.scheduledPublishAt).toEqual(publishAt);
    });

    it('should throw BadRequestException when scheduling non-draft survey', async () => {
      mockSurveyRepository.findOne.mockResolvedValue({
        id: 'survey-1',
        status: SurveyStatus.ACTIVE,
      });

      await expect(
        service.schedule('survey-1', new Date()),
      ).rejects.toThrow('Can only schedule draft surveys');
    });
  });

  describe('close', () => {
    it('should close an active survey', async () => {
      mockSurveyRepository.findOne.mockResolvedValue({
        id: 'survey-1',
        status: SurveyStatus.ACTIVE,
      });
      mockSurveyRepository.save.mockImplementation((s) => s);

      const result = await service.close('survey-1');

      expect(result.status).toBe(SurveyStatus.CLOSED);
      expect(result.closedAt).toBeInstanceOf(Date);
    });

    it('should throw BadRequestException when closing non-active survey', async () => {
      mockSurveyRepository.findOne.mockResolvedValue({
        id: 'survey-1',
        status: SurveyStatus.DRAFT,
      });

      await expect(service.close('survey-1')).rejects.toThrow(
        'Can only close active surveys',
      );
    });
  });

  describe('archive', () => {
    it('should archive a survey', async () => {
      mockSurveyRepository.findOne.mockResolvedValue({
        id: 'survey-1',
        status: SurveyStatus.CLOSED,
      });
      mockSurveyRepository.save.mockImplementation((s) => s);

      const result = await service.archive('survey-1');

      expect(result.status).toBe(SurveyStatus.ARCHIVED);
    });
  });

  describe('remove', () => {
    it('should delete a draft survey', async () => {
      mockSurveyRepository.findOne.mockResolvedValue({
        id: 'survey-1',
        status: SurveyStatus.DRAFT,
      });
      mockSurveyRepository.remove.mockResolvedValue({});

      const result = await service.remove('survey-1');

      expect(result.id).toBe('survey-1');
      expect(mockSurveyRepository.remove).toHaveBeenCalled();
    });

    it('should throw BadRequestException when deleting active survey', async () => {
      mockSurveyRepository.findOne.mockResolvedValue({
        id: 'survey-1',
        status: SurveyStatus.ACTIVE,
      });

      await expect(service.remove('survey-1')).rejects.toThrow(
        'Cannot delete an active survey',
      );
    });
  });

  describe('getStats', () => {
    it('should return survey completion statistics', async () => {
      mockAssignmentRepository.countBySurvey.mockResolvedValue(100);
      mockAssignmentRepository.countBySurveyAndStatus
        .mockResolvedValueOnce(60) // SUBMITTED
        .mockResolvedValueOnce(15); // IN_PROGRESS

      const result = await service.getStats('survey-1');

      expect(result).toEqual({
        total: 100,
        completed: 60,
        inProgress: 15,
        notStarted: 25,
        completionRate: 60,
      });
    });

    it('should handle empty survey', async () => {
      mockAssignmentRepository.countBySurvey.mockResolvedValue(0);
      mockAssignmentRepository.countBySurveyAndStatus.mockResolvedValue(0);

      const result = await service.getStats('survey-1');

      expect(result.completionRate).toBe(0);
    });
  });

  describe('getMySurveys', () => {
    it('should return employee survey assignments', async () => {
      const mockAssignments = [
        { id: 'assign-1', surveyId: 'survey-1' },
        { id: 'assign-2', surveyId: 'survey-2' },
      ];
      mockAssignmentRepository.findByEmployee.mockResolvedValue(mockAssignments);

      const result = await service.getMySurveys('emp-1');

      expect(result).toEqual(mockAssignments);
      expect(mockAssignmentRepository.findByEmployee).toHaveBeenCalledWith('emp-1');
    });
  });

  describe('getPendingSurveys', () => {
    it('should return pending survey assignments for employee', async () => {
      const mockPending = [{ id: 'assign-1', status: SurveyResponseStatus.NOT_STARTED }];
      mockAssignmentRepository.findPendingByEmployee.mockResolvedValue(mockPending);

      const result = await service.getPendingSurveys('emp-1');

      expect(result).toEqual(mockPending);
    });
  });
});
