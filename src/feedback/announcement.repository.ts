import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Announcement, AnnouncementRecipient } from './entities';
import { AnnouncementStatus, AnnouncementPriority } from './enums';

// ─── Interfaces ─────────────────────────────────────────────

export interface AnnouncementRepository {
  create(data: Partial<Announcement>): Announcement;
  save(entity: Announcement): Promise<Announcement>;
  findPaginated(options: {
    companyId: string;
    status?: AnnouncementStatus;
    priority?: AnnouncementPriority;
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ data: Announcement[]; total: number }>;
  findOne(id: string): Promise<Announcement | null>;
  findScheduledToPublish(beforeDate: Date): Promise<Announcement[]>;
  findPublishedForEmployee(
    companyId: string,
    employeeId: string,
  ): Promise<Announcement[]>;
  remove(entity: Announcement): Promise<Announcement>;
}

export interface AnnouncementRecipientRepository {
  create(data: Partial<AnnouncementRecipient>): AnnouncementRecipient;
  save(entity: AnnouncementRecipient): Promise<AnnouncementRecipient>;
  saveAll(entities: AnnouncementRecipient[]): Promise<AnnouncementRecipient[]>;
  findByAnnouncement(announcementId: string): Promise<AnnouncementRecipient[]>;
  findByEmployee(employeeId: string): Promise<AnnouncementRecipient[]>;
  findUnreadByEmployee(employeeId: string): Promise<AnnouncementRecipient[]>;
  findPendingAckByEmployee(employeeId: string): Promise<AnnouncementRecipient[]>;
  findOne(id: string): Promise<AnnouncementRecipient | null>;
  findByAnnouncementAndEmployee(
    announcementId: string,
    employeeId: string,
  ): Promise<AnnouncementRecipient | null>;
  countByAnnouncement(announcementId: string): Promise<number>;
  countReadByAnnouncement(announcementId: string): Promise<number>;
  countAcknowledgedByAnnouncement(announcementId: string): Promise<number>;
}

// ─── Implementations ────────────────────────────────────────

@Injectable()
export class TypeOrmAnnouncementRepository implements AnnouncementRepository {
  private readonly repo: Repository<Announcement>;
  constructor(@InjectDataSource() ds: DataSource) {
    this.repo = ds.getRepository(Announcement);
  }

  create(data: Partial<Announcement>): Announcement {
    return this.repo.create(data);
  }
  save(entity: Announcement): Promise<Announcement> {
    return this.repo.save(entity);
  }
  async findPaginated(options: {
    companyId: string;
    status?: AnnouncementStatus;
    priority?: AnnouncementPriority;
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ data: Announcement[]; total: number }> {
    const qb = this.repo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.createdByUser', 'creator')
      .where('a.companyId = :companyId', { companyId: options.companyId });

    if (options.status)
      qb.andWhere('a.status = :status', { status: options.status });
    if (options.priority)
      qb.andWhere('a.priority = :priority', { priority: options.priority });
    if (options.search)
      qb.andWhere('(a.title ILIKE :search OR a.body ILIKE :search)', {
        search: `%${options.search}%`,
      });

    qb.orderBy('a.isPinned', 'DESC')
      .addOrderBy('a.createdAt', 'DESC')
      .skip((options.page - 1) * options.limit)
      .take(options.limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }
  findOne(id: string): Promise<Announcement | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['createdByUser', 'recipients'],
    });
  }
  findScheduledToPublish(beforeDate: Date): Promise<Announcement[]> {
    return this.repo
      .createQueryBuilder('a')
      .where('a.status = :status', { status: AnnouncementStatus.SCHEDULED })
      .andWhere('a.scheduledPublishAt <= :beforeDate', { beforeDate })
      .getMany();
  }
  findPublishedForEmployee(
    companyId: string,
    employeeId: string,
  ): Promise<Announcement[]> {
    return this.repo
      .createQueryBuilder('a')
      .innerJoin('a.recipients', 'r', 'r.employeeId = :employeeId', {
        employeeId,
      })
      .where('a.companyId = :companyId', { companyId })
      .andWhere('a.status = :status', { status: AnnouncementStatus.PUBLISHED })
      .andWhere('(a.expiresAt IS NULL OR a.expiresAt >= CURRENT_DATE)')
      .orderBy('a.isPinned', 'DESC')
      .addOrderBy('a.publishedAt', 'DESC')
      .getMany();
  }
  remove(entity: Announcement): Promise<Announcement> {
    return this.repo.remove(entity);
  }
}

@Injectable()
export class TypeOrmAnnouncementRecipientRepository
  implements AnnouncementRecipientRepository
{
  private readonly repo: Repository<AnnouncementRecipient>;
  constructor(@InjectDataSource() ds: DataSource) {
    this.repo = ds.getRepository(AnnouncementRecipient);
  }

  create(data: Partial<AnnouncementRecipient>): AnnouncementRecipient {
    return this.repo.create(data);
  }
  save(entity: AnnouncementRecipient): Promise<AnnouncementRecipient> {
    return this.repo.save(entity);
  }
  saveAll(entities: AnnouncementRecipient[]): Promise<AnnouncementRecipient[]> {
    return this.repo.save(entities);
  }
  findByAnnouncement(announcementId: string): Promise<AnnouncementRecipient[]> {
    return this.repo.find({
      where: { announcementId },
      relations: ['employee'],
    });
  }
  findByEmployee(employeeId: string): Promise<AnnouncementRecipient[]> {
    return this.repo.find({
      where: { employeeId },
      relations: ['announcement'],
      order: { createdAt: 'DESC' },
    });
  }
  findUnreadByEmployee(employeeId: string): Promise<AnnouncementRecipient[]> {
    return this.repo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.announcement', 'a')
      .where('r.employeeId = :employeeId', { employeeId })
      .andWhere('r.hasRead = false')
      .andWhere('a.status = :status', { status: AnnouncementStatus.PUBLISHED })
      .andWhere('(a.expiresAt IS NULL OR a.expiresAt >= CURRENT_DATE)')
      .orderBy('a.publishedAt', 'DESC')
      .getMany();
  }
  findPendingAckByEmployee(employeeId: string): Promise<AnnouncementRecipient[]> {
    return this.repo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.announcement', 'a')
      .where('r.employeeId = :employeeId', { employeeId })
      .andWhere('r.hasAcknowledged = false')
      .andWhere('a.requiresAcknowledgment = true')
      .andWhere('a.status = :status', { status: AnnouncementStatus.PUBLISHED })
      .orderBy('a.acknowledgmentDueDate', 'ASC')
      .getMany();
  }
  findOne(id: string): Promise<AnnouncementRecipient | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['announcement', 'employee'],
    });
  }
  findByAnnouncementAndEmployee(
    announcementId: string,
    employeeId: string,
  ): Promise<AnnouncementRecipient | null> {
    return this.repo.findOne({
      where: { announcementId, employeeId },
      relations: ['announcement'],
    });
  }
  countByAnnouncement(announcementId: string): Promise<number> {
    return this.repo.count({ where: { announcementId } });
  }
  countReadByAnnouncement(announcementId: string): Promise<number> {
    return this.repo.count({ where: { announcementId, hasRead: true } });
  }
  countAcknowledgedByAnnouncement(announcementId: string): Promise<number> {
    return this.repo.count({ where: { announcementId, hasAcknowledged: true } });
  }
}
