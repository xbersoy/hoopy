import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  FeedbackCategory,
  FeedbackItem,
  FeedbackMessage,
  FeedbackAttachment,
  FeedbackRequestTemplate,
  FeedbackRequest,
  FeedbackRequestAssignment,
} from './entities';
import { FeedbackStatus, FeedbackAssignmentStatus } from './enums';

// ─── Interfaces ─────────────────────────────────────────────

export interface FeedbackCategoryRepository {
  create(data: Partial<FeedbackCategory>): FeedbackCategory;
  save(entity: FeedbackCategory): Promise<FeedbackCategory>;
  findByCompany(companyId: string): Promise<FeedbackCategory[]>;
  findActiveByCompany(companyId: string): Promise<FeedbackCategory[]>;
  findOne(id: string): Promise<FeedbackCategory | null>;
  findByCode(companyId: string, code: string): Promise<FeedbackCategory | null>;
  remove(entity: FeedbackCategory): Promise<FeedbackCategory>;
}

export interface FeedbackItemRepository {
  create(data: Partial<FeedbackItem>): FeedbackItem;
  save(entity: FeedbackItem): Promise<FeedbackItem>;
  findPaginated(options: {
    companyId: string;
    categoryId?: string;
    status?: FeedbackStatus;
    submissionMode?: string;
    sensitivity?: string;
    assignedToUserId?: string;
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ data: FeedbackItem[]; total: number }>;
  findBySubmitter(companyId: string, submittedById: string): Promise<FeedbackItem[]>;
  findOne(id: string): Promise<FeedbackItem | null>;
}

export interface FeedbackMessageRepository {
  create(data: Partial<FeedbackMessage>): FeedbackMessage;
  save(entity: FeedbackMessage): Promise<FeedbackMessage>;
  findByFeedbackItem(feedbackItemId: string): Promise<FeedbackMessage[]>;
}

export interface FeedbackAttachmentRepository {
  create(data: Partial<FeedbackAttachment>): FeedbackAttachment;
  save(entity: FeedbackAttachment): Promise<FeedbackAttachment>;
  saveAll(entities: FeedbackAttachment[]): Promise<FeedbackAttachment[]>;
  findByFeedbackItem(feedbackItemId: string): Promise<FeedbackAttachment[]>;
  remove(entity: FeedbackAttachment): Promise<FeedbackAttachment>;
}

export interface FeedbackRequestTemplateRepository {
  create(data: Partial<FeedbackRequestTemplate>): FeedbackRequestTemplate;
  save(entity: FeedbackRequestTemplate): Promise<FeedbackRequestTemplate>;
  findByCompany(companyId: string): Promise<FeedbackRequestTemplate[]>;
  findOne(id: string): Promise<FeedbackRequestTemplate | null>;
  remove(entity: FeedbackRequestTemplate): Promise<FeedbackRequestTemplate>;
}

export interface FeedbackRequestRepository {
  create(data: Partial<FeedbackRequest>): FeedbackRequest;
  save(entity: FeedbackRequest): Promise<FeedbackRequest>;
  findPaginated(options: {
    companyId: string;
    status?: string;
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ data: FeedbackRequest[]; total: number }>;
  findOne(id: string): Promise<FeedbackRequest | null>;
  remove(entity: FeedbackRequest): Promise<FeedbackRequest>;
}

export interface FeedbackRequestAssignmentRepository {
  create(data: Partial<FeedbackRequestAssignment>): FeedbackRequestAssignment;
  save(entity: FeedbackRequestAssignment): Promise<FeedbackRequestAssignment>;
  saveAll(entities: FeedbackRequestAssignment[]): Promise<FeedbackRequestAssignment[]>;
  findByRequest(requestId: string): Promise<FeedbackRequestAssignment[]>;
  findByEmployee(employeeId: string): Promise<FeedbackRequestAssignment[]>;
  findPendingByEmployee(employeeId: string): Promise<FeedbackRequestAssignment[]>;
  findOne(id: string): Promise<FeedbackRequestAssignment | null>;
  findByRequestAndEmployee(
    requestId: string,
    employeeId: string,
  ): Promise<FeedbackRequestAssignment | null>;
}

// ─── Implementations ────────────────────────────────────────

@Injectable()
export class TypeOrmFeedbackCategoryRepository implements FeedbackCategoryRepository {
  private readonly repo: Repository<FeedbackCategory>;
  constructor(@InjectDataSource() ds: DataSource) {
    this.repo = ds.getRepository(FeedbackCategory);
  }

  create(data: Partial<FeedbackCategory>): FeedbackCategory {
    return this.repo.create(data);
  }
  save(entity: FeedbackCategory): Promise<FeedbackCategory> {
    return this.repo.save(entity);
  }
  findByCompany(companyId: string): Promise<FeedbackCategory[]> {
    return this.repo.find({
      where: { companyId },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }
  findActiveByCompany(companyId: string): Promise<FeedbackCategory[]> {
    return this.repo.find({
      where: { companyId, isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }
  findOne(id: string): Promise<FeedbackCategory | null> {
    return this.repo.findOne({ where: { id } });
  }
  findByCode(companyId: string, code: string): Promise<FeedbackCategory | null> {
    return this.repo.findOne({ where: { companyId, code } });
  }
  remove(entity: FeedbackCategory): Promise<FeedbackCategory> {
    return this.repo.remove(entity);
  }
}

@Injectable()
export class TypeOrmFeedbackItemRepository implements FeedbackItemRepository {
  private readonly repo: Repository<FeedbackItem>;
  constructor(@InjectDataSource() ds: DataSource) {
    this.repo = ds.getRepository(FeedbackItem);
  }

  create(data: Partial<FeedbackItem>): FeedbackItem {
    return this.repo.create(data);
  }
  save(entity: FeedbackItem): Promise<FeedbackItem> {
    return this.repo.save(entity);
  }
  async findPaginated(options: {
    companyId: string;
    categoryId?: string;
    status?: FeedbackStatus;
    submissionMode?: string;
    sensitivity?: string;
    assignedToUserId?: string;
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ data: FeedbackItem[]; total: number }> {
    const qb = this.repo
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.category', 'cat')
      .leftJoinAndSelect('f.submittedBy', 'emp')
      .leftJoinAndSelect('f.assignedToUser', 'assignee')
      .where('f.companyId = :companyId', { companyId: options.companyId });

    if (options.categoryId)
      qb.andWhere('f.categoryId = :categoryId', { categoryId: options.categoryId });
    if (options.status)
      qb.andWhere('f.status = :status', { status: options.status });
    if (options.submissionMode)
      qb.andWhere('f.submissionMode = :submissionMode', {
        submissionMode: options.submissionMode,
      });
    if (options.sensitivity)
      qb.andWhere('f.sensitivity = :sensitivity', {
        sensitivity: options.sensitivity,
      });
    if (options.assignedToUserId)
      qb.andWhere('f.assignedToUserId = :assignedToUserId', {
        assignedToUserId: options.assignedToUserId,
      });
    if (options.search)
      qb.andWhere('(f.subject ILIKE :search OR f.body ILIKE :search)', {
        search: `%${options.search}%`,
      });

    qb.orderBy('f.createdAt', 'DESC')
      .skip((options.page - 1) * options.limit)
      .take(options.limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }
  findBySubmitter(companyId: string, submittedById: string): Promise<FeedbackItem[]> {
    return this.repo.find({
      where: { companyId, submittedById },
      relations: ['category'],
      order: { createdAt: 'DESC' },
    });
  }
  findOne(id: string): Promise<FeedbackItem | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['category', 'submittedBy', 'assignedToUser', 'messages', 'attachments'],
    });
  }
}

@Injectable()
export class TypeOrmFeedbackMessageRepository implements FeedbackMessageRepository {
  private readonly repo: Repository<FeedbackMessage>;
  constructor(@InjectDataSource() ds: DataSource) {
    this.repo = ds.getRepository(FeedbackMessage);
  }

  create(data: Partial<FeedbackMessage>): FeedbackMessage {
    return this.repo.create(data);
  }
  save(entity: FeedbackMessage): Promise<FeedbackMessage> {
    return this.repo.save(entity);
  }
  findByFeedbackItem(feedbackItemId: string): Promise<FeedbackMessage[]> {
    return this.repo.find({
      where: { feedbackItemId },
      relations: ['authorUser'],
      order: { createdAt: 'ASC' },
    });
  }
}

@Injectable()
export class TypeOrmFeedbackAttachmentRepository implements FeedbackAttachmentRepository {
  private readonly repo: Repository<FeedbackAttachment>;
  constructor(@InjectDataSource() ds: DataSource) {
    this.repo = ds.getRepository(FeedbackAttachment);
  }

  create(data: Partial<FeedbackAttachment>): FeedbackAttachment {
    return this.repo.create(data);
  }
  save(entity: FeedbackAttachment): Promise<FeedbackAttachment> {
    return this.repo.save(entity);
  }
  saveAll(entities: FeedbackAttachment[]): Promise<FeedbackAttachment[]> {
    return this.repo.save(entities);
  }
  findByFeedbackItem(feedbackItemId: string): Promise<FeedbackAttachment[]> {
    return this.repo.find({ where: { feedbackItemId } });
  }
  remove(entity: FeedbackAttachment): Promise<FeedbackAttachment> {
    return this.repo.remove(entity);
  }
}

@Injectable()
export class TypeOrmFeedbackRequestTemplateRepository
  implements FeedbackRequestTemplateRepository
{
  private readonly repo: Repository<FeedbackRequestTemplate>;
  constructor(@InjectDataSource() ds: DataSource) {
    this.repo = ds.getRepository(FeedbackRequestTemplate);
  }

  create(data: Partial<FeedbackRequestTemplate>): FeedbackRequestTemplate {
    return this.repo.create(data);
  }
  save(entity: FeedbackRequestTemplate): Promise<FeedbackRequestTemplate> {
    return this.repo.save(entity);
  }
  findByCompany(companyId: string): Promise<FeedbackRequestTemplate[]> {
    return this.repo.find({
      where: { companyId },
      relations: ['defaultCategory'],
      order: { name: 'ASC' },
    });
  }
  findOne(id: string): Promise<FeedbackRequestTemplate | null> {
    return this.repo.findOne({ where: { id }, relations: ['defaultCategory'] });
  }
  remove(entity: FeedbackRequestTemplate): Promise<FeedbackRequestTemplate> {
    return this.repo.remove(entity);
  }
}

@Injectable()
export class TypeOrmFeedbackRequestRepository implements FeedbackRequestRepository {
  private readonly repo: Repository<FeedbackRequest>;
  constructor(@InjectDataSource() ds: DataSource) {
    this.repo = ds.getRepository(FeedbackRequest);
  }

  create(data: Partial<FeedbackRequest>): FeedbackRequest {
    return this.repo.create(data);
  }
  save(entity: FeedbackRequest): Promise<FeedbackRequest> {
    return this.repo.save(entity);
  }
  async findPaginated(options: {
    companyId: string;
    status?: string;
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ data: FeedbackRequest[]; total: number }> {
    const qb = this.repo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.category', 'cat')
      .leftJoinAndSelect('r.template', 'tpl')
      .leftJoinAndSelect('r.createdByUser', 'creator')
      .where('r.companyId = :companyId', { companyId: options.companyId });

    if (options.status)
      qb.andWhere('r.status = :status', { status: options.status });
    if (options.search)
      qb.andWhere('r.title ILIKE :search', { search: `%${options.search}%` });

    qb.orderBy('r.createdAt', 'DESC')
      .skip((options.page - 1) * options.limit)
      .take(options.limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }
  findOne(id: string): Promise<FeedbackRequest | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['category', 'template', 'createdByUser', 'assignments', 'assignments.employee'],
    });
  }
  remove(entity: FeedbackRequest): Promise<FeedbackRequest> {
    return this.repo.remove(entity);
  }
}

@Injectable()
export class TypeOrmFeedbackRequestAssignmentRepository
  implements FeedbackRequestAssignmentRepository
{
  private readonly repo: Repository<FeedbackRequestAssignment>;
  constructor(@InjectDataSource() ds: DataSource) {
    this.repo = ds.getRepository(FeedbackRequestAssignment);
  }

  create(data: Partial<FeedbackRequestAssignment>): FeedbackRequestAssignment {
    return this.repo.create(data);
  }
  save(entity: FeedbackRequestAssignment): Promise<FeedbackRequestAssignment> {
    return this.repo.save(entity);
  }
  saveAll(entities: FeedbackRequestAssignment[]): Promise<FeedbackRequestAssignment[]> {
    return this.repo.save(entities);
  }
  findByRequest(requestId: string): Promise<FeedbackRequestAssignment[]> {
    return this.repo.find({
      where: { feedbackRequestId: requestId },
      relations: ['employee', 'feedbackItem'],
    });
  }
  findByEmployee(employeeId: string): Promise<FeedbackRequestAssignment[]> {
    return this.repo.find({
      where: { employeeId },
      relations: ['feedbackRequest', 'feedbackRequest.category'],
      order: { createdAt: 'DESC' },
    });
  }
  findPendingByEmployee(employeeId: string): Promise<FeedbackRequestAssignment[]> {
    return this.repo.find({
      where: { employeeId, status: FeedbackAssignmentStatus.PENDING },
      relations: ['feedbackRequest', 'feedbackRequest.category'],
      order: { createdAt: 'DESC' },
    });
  }
  findOne(id: string): Promise<FeedbackRequestAssignment | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['feedbackRequest', 'employee', 'feedbackItem'],
    });
  }
  findByRequestAndEmployee(
    requestId: string,
    employeeId: string,
  ): Promise<FeedbackRequestAssignment | null> {
    return this.repo.findOne({
      where: { feedbackRequestId: requestId, employeeId },
      relations: ['feedbackRequest'],
    });
  }
}
