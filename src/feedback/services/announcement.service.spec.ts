import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AnnouncementService } from './announcement.service';
import { AnnouncementStatus, AnnouncementPriority } from '../enums';

describe('AnnouncementService', () => {
  let service: AnnouncementService;

  const mockAnnouncementRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findPaginated: jest.fn(),
    remove: jest.fn(),
  };

  const mockRecipientRepository = {
    create: jest.fn(),
    save: jest.fn(),
    saveAll: jest.fn(),
    findByEmployee: jest.fn(),
    findUnreadByEmployee: jest.fn(),
    findByAnnouncementAndEmployee: jest.fn(),
    findByAnnouncement: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnouncementService,
        {
          provide: 'AnnouncementRepository',
          useValue: mockAnnouncementRepository,
        },
        {
          provide: 'AnnouncementRecipientRepository',
          useValue: mockRecipientRepository,
        },
      ],
    }).compile();

    service = module.get<AnnouncementService>(AnnouncementService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const companyId = 'company-123';
    const userId = 'user-456';

    it('should create a new announcement in DRAFT status', async () => {
      const createDto = {
        title: 'Company Holiday Notice',
        body: '<p>Offices will be closed...</p>',
        priority: AnnouncementPriority.NORMAL,
      };

      mockAnnouncementRepository.create.mockReturnValue({ id: 'ann-1' });
      mockAnnouncementRepository.save.mockResolvedValue({
        id: 'ann-1',
        ...createDto,
        status: AnnouncementStatus.DRAFT,
      });

      const result = await service.create(companyId, userId, createDto);

      expect(mockAnnouncementRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId,
          createdByUserId: userId,
          status: AnnouncementStatus.DRAFT,
        }),
      );
      expect(result.status).toBe(AnnouncementStatus.DRAFT);
    });

    it('should create announcement with optional fields', async () => {
      const createDto = {
        title: 'Important Update',
        body: 'Content here',
        summary: 'Short summary',
        priority: AnnouncementPriority.IMPORTANT,
        isPinned: true,
        requiresAcknowledgment: true,
        acknowledgmentDueDate: '2025-03-01',
      };

      mockAnnouncementRepository.create.mockReturnValue({ id: 'ann-1' });
      mockAnnouncementRepository.save.mockResolvedValue({ id: 'ann-1' });

      await service.create(companyId, userId, createDto);

      expect(mockAnnouncementRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: 'Short summary',
          isPinned: true,
          requiresAcknowledgment: true,
        }),
      );
    });

    it('should set default values for optional boolean fields', async () => {
      mockAnnouncementRepository.create.mockReturnValue({ id: 'ann-1' });
      mockAnnouncementRepository.save.mockResolvedValue({ id: 'ann-1' });

      await service.create(companyId, userId, {
        title: 'Test',
        body: 'Body',
        priority: AnnouncementPriority.NORMAL,
      });

      expect(mockAnnouncementRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isPinned: false,
          requiresAcknowledgment: false,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated announcements', async () => {
      const mockData = [{ id: 'ann-1' }, { id: 'ann-2' }];
      mockAnnouncementRepository.findPaginated.mockResolvedValue({
        data: mockData,
        total: 15,
      });

      const result = await service.findAll('company-123', { page: 1, limit: 10 });

      expect(result.data).toEqual(mockData);
      expect(result.total).toBe(15);
    });

    it('should use default pagination', async () => {
      mockAnnouncementRepository.findPaginated.mockResolvedValue({
        data: [],
        total: 0,
      });

      await service.findAll('company-123', {});

      expect(mockAnnouncementRepository.findPaginated).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 10 }),
      );
    });
  });

  describe('findOne', () => {
    it('should return announcement when found', async () => {
      const mockAnnouncement = { id: 'ann-1', title: 'Test' };
      mockAnnouncementRepository.findOne.mockResolvedValue(mockAnnouncement);

      const result = await service.findOne('ann-1');

      expect(result).toEqual(mockAnnouncement);
    });

    it('should throw NotFoundException when not found', async () => {
      mockAnnouncementRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const draftAnnouncement = {
      id: 'ann-1',
      title: 'Draft',
      status: AnnouncementStatus.DRAFT,
    };

    beforeEach(() => {
      mockAnnouncementRepository.findOne.mockResolvedValue({ ...draftAnnouncement });
    });

    it('should update draft announcement fields', async () => {
      mockAnnouncementRepository.save.mockImplementation((a) => a);

      const result = await service.update('ann-1', { title: 'Updated Title' });

      expect(result.title).toBe('Updated Title');
    });

    it('should throw BadRequestException when updating published announcement', async () => {
      mockAnnouncementRepository.findOne.mockResolvedValue({
        ...draftAnnouncement,
        status: AnnouncementStatus.PUBLISHED,
      });

      await expect(
        service.update('ann-1', { title: 'New' }),
      ).rejects.toThrow('Cannot edit a published announcement');
    });

    it('should update optional fields', async () => {
      mockAnnouncementRepository.save.mockImplementation((a) => a);

      await service.update('ann-1', {
        summary: 'New summary',
        isPinned: true,
        requiresAcknowledgment: true,
      });

      expect(mockAnnouncementRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: 'New summary',
          isPinned: true,
          requiresAcknowledgment: true,
        }),
      );
    });
  });

  describe('publish', () => {
    const draftAnnouncement = {
      id: 'ann-1',
      status: AnnouncementStatus.DRAFT,
    };

    it('should publish announcement and create recipients', async () => {
      mockAnnouncementRepository.findOne.mockResolvedValue(draftAnnouncement);
      mockRecipientRepository.create.mockReturnValue({ id: 'rec-1' });
      mockRecipientRepository.saveAll.mockResolvedValue([]);
      mockAnnouncementRepository.save.mockImplementation((a) => a);

      const result = await service.publish('ann-1', ['emp-1', 'emp-2']);

      expect(result.status).toBe(AnnouncementStatus.PUBLISHED);
      expect(result.publishedAt).toBeInstanceOf(Date);
      expect(mockRecipientRepository.create).toHaveBeenCalledTimes(2);
      expect(mockRecipientRepository.saveAll).toHaveBeenCalled();
    });

    it('should throw BadRequestException when publishing non-draft', async () => {
      mockAnnouncementRepository.findOne.mockResolvedValue({
        ...draftAnnouncement,
        status: AnnouncementStatus.PUBLISHED,
      });

      await expect(
        service.publish('ann-1', ['emp-1']),
      ).rejects.toThrow('Can only publish draft announcements');
    });

    it('should throw BadRequestException when no recipients provided', async () => {
      mockAnnouncementRepository.findOne.mockResolvedValue({
        id: 'ann-1',
        status: AnnouncementStatus.DRAFT,
      });

      await expect(service.publish('ann-1', [])).rejects.toThrow(
        'At least one recipient is required',
      );
    });

    it('should create recipients with unread and unacknowledged status', async () => {
      mockAnnouncementRepository.findOne.mockResolvedValue({
        id: 'ann-1',
        status: AnnouncementStatus.DRAFT,
      });
      mockRecipientRepository.create.mockImplementation((data) => data);
      mockRecipientRepository.saveAll.mockResolvedValue([]);
      mockAnnouncementRepository.save.mockImplementation((a) => a);

      await service.publish('ann-1', ['emp-1']);

      expect(mockRecipientRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          hasRead: false,
          hasAcknowledged: false,
        }),
      );
    });
  });

  describe('schedule', () => {
    it('should schedule a draft announcement', async () => {
      mockAnnouncementRepository.findOne.mockResolvedValue({
        id: 'ann-1',
        status: AnnouncementStatus.DRAFT,
      });
      mockAnnouncementRepository.save.mockImplementation((a) => a);

      const publishAt = new Date('2025-06-01');
      const result = await service.schedule('ann-1', publishAt);

      expect(result.status).toBe(AnnouncementStatus.SCHEDULED);
      expect(result.scheduledPublishAt).toEqual(publishAt);
    });

    it('should throw BadRequestException when scheduling non-draft', async () => {
      mockAnnouncementRepository.findOne.mockResolvedValue({
        id: 'ann-1',
        status: AnnouncementStatus.PUBLISHED,
      });

      await expect(
        service.schedule('ann-1', new Date()),
      ).rejects.toThrow('Can only schedule draft announcements');
    });
  });

  describe('archive', () => {
    it('should archive an announcement', async () => {
      mockAnnouncementRepository.findOne.mockResolvedValue({
        id: 'ann-1',
        status: AnnouncementStatus.PUBLISHED,
      });
      mockAnnouncementRepository.save.mockImplementation((a) => a);

      const result = await service.archive('ann-1');

      expect(result.status).toBe(AnnouncementStatus.ARCHIVED);
      expect(result.archivedAt).toBeInstanceOf(Date);
    });
  });

  describe('remove', () => {
    it('should delete a draft announcement', async () => {
      mockAnnouncementRepository.findOne.mockResolvedValue({
        id: 'ann-1',
        status: AnnouncementStatus.DRAFT,
      });
      mockAnnouncementRepository.remove.mockResolvedValue({});

      const result = await service.remove('ann-1');

      expect(result.id).toBe('ann-1');
      expect(mockAnnouncementRepository.remove).toHaveBeenCalled();
    });

    it('should throw BadRequestException when deleting published announcement', async () => {
      mockAnnouncementRepository.findOne.mockResolvedValue({
        id: 'ann-1',
        status: AnnouncementStatus.PUBLISHED,
      });

      await expect(service.remove('ann-1')).rejects.toThrow(
        'Cannot delete a published announcement',
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark announcement as read', async () => {
      const mockRecipient = {
        id: 'rec-1',
        hasRead: false,
        readAt: null,
      };
      mockRecipientRepository.findByAnnouncementAndEmployee.mockResolvedValue(mockRecipient);
      mockRecipientRepository.save.mockImplementation((r) => r);

      const result = await service.markAsRead('ann-1', 'emp-1');

      expect(result.hasRead).toBe(true);
      expect(result.readAt).toBeInstanceOf(Date);
    });

    it('should not update if already read', async () => {
      const mockRecipient = {
        id: 'rec-1',
        hasRead: true,
        readAt: new Date('2025-01-01'),
      };
      mockRecipientRepository.findByAnnouncementAndEmployee.mockResolvedValue(mockRecipient);

      await service.markAsRead('ann-1', 'emp-1');

      expect(mockRecipientRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if recipient not found', async () => {
      mockRecipientRepository.findByAnnouncementAndEmployee.mockResolvedValue(null);

      await expect(
        service.markAsRead('ann-1', 'emp-1'),
      ).rejects.toThrow('Recipient record not found');
    });
  });

  describe('acknowledge', () => {
    const announcementRequiringAck = {
      id: 'ann-1',
      requiresAcknowledgment: true,
    };

    beforeEach(() => {
      mockAnnouncementRepository.findOne.mockResolvedValue(announcementRequiringAck);
    });

    it('should acknowledge announcement and mark as read', async () => {
      const mockRecipient = {
        id: 'rec-1',
        hasRead: false,
        hasAcknowledged: false,
      };
      mockRecipientRepository.findByAnnouncementAndEmployee.mockResolvedValue(mockRecipient);
      mockRecipientRepository.save.mockImplementation((r) => r);

      const result = await service.acknowledge('ann-1', 'emp-1');

      expect(result.hasAcknowledged).toBe(true);
      expect(result.acknowledgedAt).toBeInstanceOf(Date);
      expect(result.hasRead).toBe(true);
      expect(result.readAt).toBeInstanceOf(Date);
    });

    it('should throw BadRequestException if acknowledgment not required', async () => {
      mockAnnouncementRepository.findOne.mockResolvedValue({
        id: 'ann-1',
        requiresAcknowledgment: false,
      });

      await expect(
        service.acknowledge('ann-1', 'emp-1'),
      ).rejects.toThrow('This announcement does not require acknowledgment');
    });

    it('should not update if already acknowledged', async () => {
      const mockRecipient = {
        id: 'rec-1',
        hasAcknowledged: true,
        acknowledgedAt: new Date('2025-01-01'),
      };
      mockRecipientRepository.findByAnnouncementAndEmployee.mockResolvedValue(mockRecipient);

      await service.acknowledge('ann-1', 'emp-1');

      expect(mockRecipientRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return announcement statistics', async () => {
      mockAnnouncementRepository.findOne.mockResolvedValue({
        id: 'ann-1',
        requiresAcknowledgment: true,
        acknowledgmentDueDate: new Date('2025-01-01'), // Past due
      });
      mockRecipientRepository.findByAnnouncement.mockResolvedValue([
        { hasRead: true, hasAcknowledged: true },
        { hasRead: true, hasAcknowledged: false },
        { hasRead: false, hasAcknowledged: false },
        { hasRead: false, hasAcknowledged: false },
      ]);

      const result = await service.getStats('ann-1');

      expect(result).toEqual({
        totalRecipients: 4,
        readCount: 2,
        unreadCount: 2,
        acknowledgedCount: 1,
        overdueAcknowledgments: 3, // 4 total - 1 acknowledged
        readRate: 50,
        acknowledgmentRate: 25,
      });
    });

    it('should handle empty recipients', async () => {
      mockAnnouncementRepository.findOne.mockResolvedValue({
        id: 'ann-1',
        requiresAcknowledgment: false,
      });
      mockRecipientRepository.findByAnnouncement.mockResolvedValue([]);

      const result = await service.getStats('ann-1');

      expect(result.totalRecipients).toBe(0);
      expect(result.readRate).toBe(0);
      expect(result.acknowledgmentRate).toBe(0);
    });

    it('should not count overdue if due date not passed', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      mockAnnouncementRepository.findOne.mockResolvedValue({
        id: 'ann-1',
        requiresAcknowledgment: true,
        acknowledgmentDueDate: futureDate,
      });
      mockRecipientRepository.findByAnnouncement.mockResolvedValue([
        { hasRead: true, hasAcknowledged: false },
      ]);

      const result = await service.getStats('ann-1');

      expect(result.overdueAcknowledgments).toBe(0);
    });
  });

  describe('employee-facing methods', () => {
    it('getMyAnnouncements should return employee announcements', async () => {
      const mockRecipients = [{ id: 'rec-1' }, { id: 'rec-2' }];
      mockRecipientRepository.findByEmployee.mockResolvedValue(mockRecipients);

      const result = await service.getMyAnnouncements('emp-1');

      expect(result).toEqual(mockRecipients);
      expect(mockRecipientRepository.findByEmployee).toHaveBeenCalledWith('emp-1');
    });

    it('getUnreadAnnouncements should return unread announcements', async () => {
      const mockUnread = [{ id: 'rec-1', hasRead: false }];
      mockRecipientRepository.findUnreadByEmployee.mockResolvedValue(mockUnread);

      const result = await service.getUnreadAnnouncements('emp-1');

      expect(result).toEqual(mockUnread);
    });
  });
});
