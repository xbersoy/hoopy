import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Announcement } from '../entities/announcement.entity';
import { AnnouncementRecipient } from '../entities/announcement-recipient.entity';
import {
  AnnouncementRepository,
  AnnouncementRecipientRepository,
} from '../announcement.repository';
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  QueryAnnouncementDto,
} from '../dto/announcement.dto';
import { PaginatedResponse } from '../../shared/dto';
import { AnnouncementStatus } from '../enums';

@Injectable()
export class AnnouncementService {
  constructor(
    @Inject('AnnouncementRepository')
    private readonly announcementRepository: AnnouncementRepository,

    @Inject('AnnouncementRecipientRepository')
    private readonly recipientRepository: AnnouncementRecipientRepository,
  ) {}

  async create(
    companyId: string,
    createdByUserId: string,
    dto: CreateAnnouncementDto,
  ): Promise<Announcement> {
    const announcement = this.announcementRepository.create({
      companyId,
      title: dto.title,
      summary: dto.summary || null,
      body: dto.body,
      priority: dto.priority,
      isPinned: dto.isPinned ?? false,
      requiresAcknowledgment: dto.requiresAcknowledgment ?? false,
      acknowledgmentDueDate: dto.acknowledgmentDueDate
        ? new Date(dto.acknowledgmentDueDate)
        : null,
      audienceType: dto.audienceType,
      audienceConfig: dto.audienceConfig || null,
      scheduledPublishAt: dto.scheduledPublishAt
        ? new Date(dto.scheduledPublishAt)
        : null,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      attachments: dto.attachments || null,
      createdByUserId,
      status: AnnouncementStatus.DRAFT,
    });

    return this.announcementRepository.save(announcement);
  }

  async findAll(
    companyId: string,
    query: QueryAnnouncementDto,
  ): Promise<PaginatedResponse<Announcement>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const { data, total } = await this.announcementRepository.findPaginated({
      companyId,
      status: query.status,
      search: query.search,
      page,
      limit,
    });

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Announcement> {
    const announcement = await this.announcementRepository.findOne(id);
    if (!announcement) {
      throw new NotFoundException(`Announcement with ID "${id}" not found`);
    }
    return announcement;
  }

  async update(id: string, dto: UpdateAnnouncementDto): Promise<Announcement> {
    const announcement = await this.findOne(id);

    if (announcement.status === AnnouncementStatus.PUBLISHED) {
      throw new BadRequestException('Cannot edit a published announcement');
    }

    if (dto.title !== undefined) announcement.title = dto.title;
    if (dto.summary !== undefined) announcement.summary = dto.summary || null;
    if (dto.body !== undefined) announcement.body = dto.body;
    if (dto.priority !== undefined) announcement.priority = dto.priority;
    if (dto.isPinned !== undefined) announcement.isPinned = dto.isPinned;
    if (dto.requiresAcknowledgment !== undefined)
      announcement.requiresAcknowledgment = dto.requiresAcknowledgment;
    if (dto.acknowledgmentDueDate !== undefined)
      announcement.acknowledgmentDueDate = dto.acknowledgmentDueDate
        ? new Date(dto.acknowledgmentDueDate)
        : null;
    if (dto.scheduledPublishAt !== undefined)
      announcement.scheduledPublishAt = dto.scheduledPublishAt
        ? new Date(dto.scheduledPublishAt)
        : null;
    if (dto.expiresAt !== undefined)
      announcement.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    if (dto.attachments !== undefined)
      announcement.attachments = dto.attachments || null;

    return this.announcementRepository.save(announcement);
  }

  async publish(id: string, employeeIds: string[]): Promise<Announcement> {
    const announcement = await this.findOne(id);

    if (announcement.status !== AnnouncementStatus.DRAFT) {
      throw new BadRequestException('Can only publish draft announcements');
    }

    if (employeeIds.length === 0) {
      throw new BadRequestException('At least one recipient is required');
    }

    // Create recipients
    const recipients = employeeIds.map((employeeId) =>
      this.recipientRepository.create({
        announcementId: announcement.id,
        employeeId,
        hasRead: false,
        hasAcknowledged: false,
      }),
    );
    await this.recipientRepository.saveAll(recipients);

    // Update announcement status
    announcement.status = AnnouncementStatus.PUBLISHED;
    announcement.publishedAt = new Date();

    return this.announcementRepository.save(announcement);
  }

  async schedule(id: string, publishAt: Date): Promise<Announcement> {
    const announcement = await this.findOne(id);

    if (announcement.status !== AnnouncementStatus.DRAFT) {
      throw new BadRequestException('Can only schedule draft announcements');
    }

    announcement.status = AnnouncementStatus.SCHEDULED;
    announcement.scheduledPublishAt = publishAt;

    return this.announcementRepository.save(announcement);
  }

  async archive(id: string): Promise<Announcement> {
    const announcement = await this.findOne(id);
    announcement.status = AnnouncementStatus.ARCHIVED;
    announcement.archivedAt = new Date();
    return this.announcementRepository.save(announcement);
  }

  async remove(id: string): Promise<Announcement> {
    const announcement = await this.findOne(id);

    if (announcement.status === AnnouncementStatus.PUBLISHED) {
      throw new BadRequestException('Cannot delete a published announcement');
    }

    const removed = await this.announcementRepository.remove(announcement);
    return { ...removed, id };
  }

  // ─── Employee-facing methods ─────────────────────────────

  async getMyAnnouncements(employeeId: string): Promise<AnnouncementRecipient[]> {
    return this.recipientRepository.findByEmployee(employeeId);
  }

  async getUnreadAnnouncements(employeeId: string): Promise<AnnouncementRecipient[]> {
    return this.recipientRepository.findUnreadByEmployee(employeeId);
  }

  async markAsRead(announcementId: string, employeeId: string): Promise<AnnouncementRecipient> {
    const recipient = await this.recipientRepository.findByAnnouncementAndEmployee(
      announcementId,
      employeeId,
    );

    if (!recipient) {
      throw new NotFoundException('Recipient record not found');
    }

    if (!recipient.hasRead) {
      recipient.hasRead = true;
      recipient.readAt = new Date();
      await this.recipientRepository.save(recipient);
    }

    return recipient;
  }

  async markAsUnread(
    announcementId: string,
    employeeId: string,
  ): Promise<AnnouncementRecipient> {
    const recipient = await this.recipientRepository.findByAnnouncementAndEmployee(
      announcementId,
      employeeId,
    );

    if (!recipient) {
      throw new NotFoundException('Recipient record not found');
    }

    if (recipient.hasAcknowledged) {
      throw new BadRequestException(
        'Cannot mark as unread after acknowledgment',
      );
    }

    if (recipient.hasRead) {
      recipient.hasRead = false;
      recipient.readAt = null;
      await this.recipientRepository.save(recipient);
    }

    return recipient;
  }

  async acknowledge(announcementId: string, employeeId: string): Promise<AnnouncementRecipient> {
    const announcement = await this.findOne(announcementId);

    if (!announcement.requiresAcknowledgment) {
      throw new BadRequestException('This announcement does not require acknowledgment');
    }

    const recipient = await this.recipientRepository.findByAnnouncementAndEmployee(
      announcementId,
      employeeId,
    );

    if (!recipient) {
      throw new NotFoundException('Recipient record not found');
    }

    if (!recipient.hasAcknowledged) {
      recipient.hasAcknowledged = true;
      recipient.acknowledgedAt = new Date();
      recipient.hasRead = true;
      recipient.readAt = recipient.readAt || new Date();
      await this.recipientRepository.save(recipient);
    }

    return recipient;
  }

  // ─── Analytics ───────────────────────────────────────────

  async getStats(announcementId: string): Promise<{
    totalRecipients: number;
    readCount: number;
    unreadCount: number;
    acknowledgedCount: number;
    overdueAcknowledgments: number;
    readRate: number;
    acknowledgmentRate: number;
  }> {
    const announcement = await this.findOne(announcementId);
    const recipients = await this.recipientRepository.findByAnnouncement(announcementId);

    const totalRecipients = recipients.length;
    const readCount = recipients.filter((r) => r.hasRead).length;
    const acknowledgedCount = recipients.filter((r) => r.hasAcknowledged).length;

    let overdueAcknowledgments = 0;
    if (
      announcement.requiresAcknowledgment &&
      announcement.acknowledgmentDueDate &&
      new Date() > announcement.acknowledgmentDueDate
    ) {
      overdueAcknowledgments = recipients.filter((r) => !r.hasAcknowledged).length;
    }

    return {
      totalRecipients,
      readCount,
      unreadCount: totalRecipients - readCount,
      acknowledgedCount,
      overdueAcknowledgments,
      readRate:
        totalRecipients > 0 ? Math.round((readCount / totalRecipients) * 100) : 0,
      acknowledgmentRate:
        totalRecipients > 0
          ? Math.round((acknowledgedCount / totalRecipients) * 100)
          : 0,
    };
  }
}
