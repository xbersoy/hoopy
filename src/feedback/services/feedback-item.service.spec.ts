import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FeedbackItemService } from './feedback-item.service';
import {
  FeedbackSubmissionMode,
  FeedbackStatus,
  FeedbackSensitivity,
} from '../enums';

describe('FeedbackItemService', () => {
  let service: FeedbackItemService;

  const mockItemRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findPaginated: jest.fn(),
    findBySubmitter: jest.fn(),
  };

  const mockMessageRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findByFeedbackItem: jest.fn(),
  };

  const mockAttachmentRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockCategoryRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackItemService,
        {
          provide: 'FeedbackItemRepository',
          useValue: mockItemRepository,
        },
        {
          provide: 'FeedbackMessageRepository',
          useValue: mockMessageRepository,
        },
        {
          provide: 'FeedbackAttachmentRepository',
          useValue: mockAttachmentRepository,
        },
        {
          provide: 'FeedbackCategoryRepository',
          useValue: mockCategoryRepository,
        },
      ],
    }).compile();

    service = module.get<FeedbackItemService>(FeedbackItemService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const companyId = 'company-123';
    const employeeId = 'employee-456';
    const categoryId = 'category-789';

    const validCategory = {
      id: categoryId,
      companyId,
      name: 'General Feedback',
      allowAnonymous: true,
      defaultSensitivity: FeedbackSensitivity.NORMAL,
    };

    const createDto = {
      categoryId,
      submissionMode: FeedbackSubmissionMode.IDENTIFIED,
      subject: 'Test Feedback',
      body: 'This is a test feedback submission',
    };

    it('should create an identified feedback item', async () => {
      mockCategoryRepository.findOne.mockResolvedValue(validCategory);
      mockItemRepository.create.mockReturnValue({ id: 'new-item' });
      mockItemRepository.save.mockResolvedValue({
        id: 'new-item',
        ...createDto,
        companyId,
        submittedById: employeeId,
        status: FeedbackStatus.SUBMITTED,
      });

      const result = await service.create(companyId, employeeId, createDto);

      expect(mockCategoryRepository.findOne).toHaveBeenCalledWith(categoryId);
      expect(mockItemRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId,
          submittedById: employeeId,
          status: FeedbackStatus.SUBMITTED,
        }),
      );
      expect(result.id).toBe('new-item');
    });

    it('should create anonymous feedback without storing employee ID', async () => {
      mockCategoryRepository.findOne.mockResolvedValue(validCategory);
      const anonymousDto = {
        ...createDto,
        submissionMode: FeedbackSubmissionMode.ANONYMOUS,
      };
      mockItemRepository.create.mockReturnValue({ id: 'anon-item' });
      mockItemRepository.save.mockResolvedValue({
        id: 'anon-item',
        submittedById: null,
      });

      await service.create(companyId, employeeId, anonymousDto);

      expect(mockItemRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          submittedById: null,
        }),
      );
    });

    it('should throw BadRequestException for invalid category', async () => {
      mockCategoryRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create(companyId, employeeId, createDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for category from different company', async () => {
      mockCategoryRepository.findOne.mockResolvedValue({
        ...validCategory,
        companyId: 'other-company',
      });

      await expect(
        service.create(companyId, employeeId, createDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for anonymous submission when not allowed', async () => {
      mockCategoryRepository.findOne.mockResolvedValue({
        ...validCategory,
        allowAnonymous: false,
      });

      const anonymousDto = {
        ...createDto,
        submissionMode: FeedbackSubmissionMode.ANONYMOUS,
      };

      await expect(
        service.create(companyId, employeeId, anonymousDto),
      ).rejects.toThrow('Anonymous submissions are not allowed for this category');
    });

    it('should use category default sensitivity when not provided', async () => {
      mockCategoryRepository.findOne.mockResolvedValue({
        ...validCategory,
        defaultSensitivity: FeedbackSensitivity.SENSITIVE,
      });
      mockItemRepository.create.mockReturnValue({ id: 'item' });
      mockItemRepository.save.mockResolvedValue({ id: 'item' });

      await service.create(companyId, employeeId, createDto);

      expect(mockItemRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sensitivity: FeedbackSensitivity.SENSITIVE,
        }),
      );
    });
  });

  describe('findPaginated', () => {
    it('should return paginated feedback items', async () => {
      const mockData = [{ id: 'item-1' }, { id: 'item-2' }];
      mockItemRepository.findPaginated.mockResolvedValue({
        data: mockData,
        total: 25,
      });

      const result = await service.findPaginated('company-123', {
        page: 2,
        limit: 10,
      });

      expect(result.data).toEqual(mockData);
      expect(result.total).toBe(25);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
    });

    it('should use default pagination when not provided', async () => {
      mockItemRepository.findPaginated.mockResolvedValue({
        data: [],
        total: 0,
      });

      const result = await service.findPaginated('company-123', {});

      expect(mockItemRepository.findPaginated).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 10,
        }),
      );
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should pass all filter parameters', async () => {
      mockItemRepository.findPaginated.mockResolvedValue({
        data: [],
        total: 0,
      });

      await service.findPaginated('company-123', {
        categoryId: 'cat-1',
        status: FeedbackStatus.UNDER_REVIEW,
        submissionMode: FeedbackSubmissionMode.ANONYMOUS,
        sensitivity: FeedbackSensitivity.CRITICAL,
        assignedToUserId: 'user-1',
        search: 'test search',
      });

      expect(mockItemRepository.findPaginated).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryId: 'cat-1',
          status: FeedbackStatus.UNDER_REVIEW,
          submissionMode: FeedbackSubmissionMode.ANONYMOUS,
          sensitivity: FeedbackSensitivity.CRITICAL,
          assignedToUserId: 'user-1',
          search: 'test search',
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a feedback item when found', async () => {
      const mockItem = { id: 'item-1', subject: 'Test' };
      mockItemRepository.findOne.mockResolvedValue(mockItem);

      const result = await service.findOne('item-1');

      expect(result).toEqual(mockItem);
    });

    it('should throw NotFoundException when item does not exist', async () => {
      mockItemRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const existingItem = {
      id: 'item-1',
      status: FeedbackStatus.SUBMITTED,
      sensitivity: FeedbackSensitivity.NORMAL,
    };

    beforeEach(() => {
      mockItemRepository.findOne.mockResolvedValue({ ...existingItem });
    });

    it('should update sensitivity', async () => {
      mockItemRepository.save.mockResolvedValue({
        ...existingItem,
        sensitivity: FeedbackSensitivity.SENSITIVE,
      });

      await service.update('item-1', {
        sensitivity: FeedbackSensitivity.SENSITIVE,
      });

      expect(mockItemRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          sensitivity: FeedbackSensitivity.SENSITIVE,
        }),
      );
    });

    it('should update status with valid transition', async () => {
      mockItemRepository.save.mockResolvedValue({
        ...existingItem,
        status: FeedbackStatus.RECEIVED,
      });

      await service.update('item-1', { status: FeedbackStatus.RECEIVED });

      expect(mockItemRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: FeedbackStatus.RECEIVED,
        }),
      );
    });

    it('should set resolvedAt when transitioning to RESOLVED', async () => {
      mockItemRepository.findOne.mockResolvedValue({
        ...existingItem,
        status: FeedbackStatus.UNDER_REVIEW,
      });
      mockItemRepository.save.mockImplementation((item) => item);

      const result = await service.update('item-1', {
        status: FeedbackStatus.RESOLVED,
      });

      expect(result.resolvedAt).toBeInstanceOf(Date);
    });

    it('should set closedAt when transitioning to CLOSED', async () => {
      mockItemRepository.findOne.mockResolvedValue({
        ...existingItem,
        status: FeedbackStatus.RESOLVED,
      });
      mockItemRepository.save.mockImplementation((item) => item);

      const result = await service.update('item-1', {
        status: FeedbackStatus.CLOSED,
      });

      expect(result.closedAt).toBeInstanceOf(Date);
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      mockItemRepository.findOne.mockResolvedValue({
        ...existingItem,
        status: FeedbackStatus.CLOSED,
      });

      await expect(
        service.update('item-1', { status: FeedbackStatus.SUBMITTED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should assign user', async () => {
      mockItemRepository.save.mockImplementation((item) => item);

      await service.update('item-1', { assignedToUserId: 'user-123' });

      expect(mockItemRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          assignedToUserId: 'user-123',
        }),
      );
    });
  });

  describe('status transitions', () => {
    const testCases = [
      // Valid transitions from SUBMITTED
      { from: FeedbackStatus.SUBMITTED, to: FeedbackStatus.RECEIVED, valid: true },
      { from: FeedbackStatus.SUBMITTED, to: FeedbackStatus.DISMISSED, valid: true },
      { from: FeedbackStatus.SUBMITTED, to: FeedbackStatus.ESCALATED, valid: true },
      { from: FeedbackStatus.SUBMITTED, to: FeedbackStatus.CLOSED, valid: false },

      // Valid transitions from RECEIVED
      { from: FeedbackStatus.RECEIVED, to: FeedbackStatus.UNDER_REVIEW, valid: true },
      { from: FeedbackStatus.RECEIVED, to: FeedbackStatus.DISMISSED, valid: true },
      { from: FeedbackStatus.RECEIVED, to: FeedbackStatus.RESOLVED, valid: false },

      // Valid transitions from UNDER_REVIEW
      { from: FeedbackStatus.UNDER_REVIEW, to: FeedbackStatus.IN_PROGRESS, valid: true },
      { from: FeedbackStatus.UNDER_REVIEW, to: FeedbackStatus.RESOLVED, valid: true },
      { from: FeedbackStatus.UNDER_REVIEW, to: FeedbackStatus.NEEDS_MORE_INFO, valid: true },

      // Closed state should not allow transitions
      { from: FeedbackStatus.CLOSED, to: FeedbackStatus.RESOLVED, valid: false },
      { from: FeedbackStatus.CLOSED, to: FeedbackStatus.SUBMITTED, valid: false },

      // Dismissed state should not allow transitions
      { from: FeedbackStatus.DISMISSED, to: FeedbackStatus.RECEIVED, valid: false },
    ];

    testCases.forEach(({ from, to, valid }) => {
      it(`${valid ? 'should allow' : 'should reject'} transition from ${from} to ${to}`, async () => {
        mockItemRepository.findOne.mockResolvedValue({
          id: 'item-1',
          status: from,
        });

        if (valid) {
          mockItemRepository.save.mockImplementation((item) => item);
          await expect(service.update('item-1', { status: to })).resolves.toBeDefined();
        } else {
          await expect(service.update('item-1', { status: to })).rejects.toThrow(
            BadRequestException,
          );
        }
      });
    });
  });

  describe('addMessage', () => {
    it('should add a message to a feedback item', async () => {
      mockItemRepository.findOne.mockResolvedValue({ id: 'item-1' });
      mockMessageRepository.create.mockReturnValue({ id: 'msg-1' });
      mockMessageRepository.save.mockResolvedValue({
        id: 'msg-1',
        content: 'Test message',
        isInternal: false,
      });

      const result = await service.addMessage('item-1', 'user-1', {
        content: 'Test message',
      });

      expect(mockMessageRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          feedbackItemId: 'item-1',
          content: 'Test message',
          isInternal: false,
          authorUserId: 'user-1',
        }),
      );
      expect(result.content).toBe('Test message');
    });

    it('should create internal message when specified', async () => {
      mockItemRepository.findOne.mockResolvedValue({ id: 'item-1' });
      mockMessageRepository.create.mockReturnValue({ id: 'msg-1' });
      mockMessageRepository.save.mockResolvedValue({ id: 'msg-1' });

      await service.addMessage('item-1', 'user-1', {
        content: 'Internal note',
        isInternal: true,
      });

      expect(mockMessageRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isInternal: true,
        }),
      );
    });

    it('should throw NotFoundException for non-existent feedback item', async () => {
      mockItemRepository.findOne.mockResolvedValue(null);

      await expect(
        service.addMessage('non-existent', 'user-1', { content: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMessages', () => {
    it('should return messages for a feedback item', async () => {
      mockItemRepository.findOne.mockResolvedValue({ id: 'item-1' });
      const mockMessages = [
        { id: 'msg-1', content: 'Hello' },
        { id: 'msg-2', content: 'World' },
      ];
      mockMessageRepository.findByFeedbackItem.mockResolvedValue(mockMessages);

      const result = await service.getMessages('item-1');

      expect(result).toEqual(mockMessages);
      expect(mockMessageRepository.findByFeedbackItem).toHaveBeenCalledWith('item-1');
    });
  });

  describe('helper methods', () => {
    it('markAsReceived should update status to RECEIVED', async () => {
      mockItemRepository.findOne.mockResolvedValue({
        id: 'item-1',
        status: FeedbackStatus.SUBMITTED,
      });
      mockItemRepository.save.mockImplementation((item) => item);

      const result = await service.markAsReceived('item-1');

      expect(result.status).toBe(FeedbackStatus.RECEIVED);
    });

    it('assignTo should update assignee and status', async () => {
      mockItemRepository.findOne.mockResolvedValue({
        id: 'item-1',
        status: FeedbackStatus.RECEIVED,
      });
      mockItemRepository.save.mockImplementation((item) => item);

      const result = await service.assignTo('item-1', 'user-123');

      expect(result.assignedToUserId).toBe('user-123');
      expect(result.status).toBe(FeedbackStatus.UNDER_REVIEW);
    });

    it('escalate should set status to ESCALATED and sensitivity to CRITICAL', async () => {
      mockItemRepository.findOne.mockResolvedValue({
        id: 'item-1',
        status: FeedbackStatus.UNDER_REVIEW,
        sensitivity: FeedbackSensitivity.NORMAL,
      });
      mockItemRepository.save.mockImplementation((item) => item);

      const result = await service.escalate('item-1');

      expect(result.status).toBe(FeedbackStatus.ESCALATED);
      expect(result.sensitivity).toBe(FeedbackSensitivity.CRITICAL);
    });
  });
});
