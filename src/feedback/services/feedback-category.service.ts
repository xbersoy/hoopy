import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FeedbackCategory } from '../entities/feedback-category.entity';
import { FeedbackCategoryRepository } from '../feedback.repository';
import {
  CreateFeedbackCategoryDto,
  UpdateFeedbackCategoryDto,
} from '../dto/feedback-category.dto';
import { SystemFeedbackCategory, FeedbackSensitivity } from '../enums';

@Injectable()
export class FeedbackCategoryService {
  constructor(
    @Inject('FeedbackCategoryRepository')
    private readonly categoryRepository: FeedbackCategoryRepository,
  ) {}

  async create(
    companyId: string,
    dto: CreateFeedbackCategoryDto,
  ): Promise<FeedbackCategory> {
    const existing = await this.categoryRepository.findByCode(companyId, dto.code);
    if (existing) {
      throw new BadRequestException(`Category code "${dto.code}" already exists`);
    }

    const category = this.categoryRepository.create({
      companyId,
      code: dto.code,
      name: dto.name,
      description: dto.description || null,
      icon: dto.icon || null,
      color: dto.color || null,
      defaultSensitivity: dto.defaultSensitivity || FeedbackSensitivity.NORMAL,
      allowAnonymous: dto.allowAnonymous ?? true,
      sortOrder: dto.sortOrder ?? 0,
      routingRules: dto.routingRules || null,
    });

    return this.categoryRepository.save(category);
  }

  async findAll(companyId: string): Promise<FeedbackCategory[]> {
    return this.categoryRepository.findByCompany(companyId);
  }

  async findActive(companyId: string): Promise<FeedbackCategory[]> {
    return this.categoryRepository.findActiveByCompany(companyId);
  }

  async findOne(id: string): Promise<FeedbackCategory> {
    const category = await this.categoryRepository.findOne(id);
    if (!category) {
      throw new NotFoundException(`Feedback category with ID "${id}" not found`);
    }
    return category;
  }

  async update(
    id: string,
    dto: UpdateFeedbackCategoryDto,
  ): Promise<FeedbackCategory> {
    const category = await this.findOne(id);

    if (dto.name !== undefined) category.name = dto.name;
    if (dto.description !== undefined) category.description = dto.description || null;
    if (dto.icon !== undefined) category.icon = dto.icon || null;
    if (dto.color !== undefined) category.color = dto.color || null;
    if (dto.defaultSensitivity !== undefined)
      category.defaultSensitivity = dto.defaultSensitivity;
    if (dto.allowAnonymous !== undefined) category.allowAnonymous = dto.allowAnonymous;
    if (dto.isActive !== undefined) category.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) category.sortOrder = dto.sortOrder;
    if (dto.routingRules !== undefined) category.routingRules = dto.routingRules || null;

    return this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<FeedbackCategory> {
    const category = await this.findOne(id);
    if (category.isSystem) {
      throw new BadRequestException('Cannot delete a system category');
    }
    const removed = await this.categoryRepository.remove(category);
    return { ...removed, id };
  }

  async seedSystemCategories(companyId: string): Promise<void> {
    const systemCategories = [
      { code: SystemFeedbackCategory.SUGGESTION, name: 'Suggestion', icon: 'lightbulb', color: '#10B981', sortOrder: 1 },
      { code: SystemFeedbackCategory.CONCERN, name: 'Concern', icon: 'alert-circle', color: '#F59E0B', sortOrder: 2 },
      { code: SystemFeedbackCategory.COMPLAINT, name: 'Complaint', icon: 'alert-triangle', color: '#EF4444', sortOrder: 3 },
      { code: SystemFeedbackCategory.RECOGNITION, name: 'Recognition', icon: 'star', color: '#8B5CF6', sortOrder: 4 },
      { code: SystemFeedbackCategory.MANAGER_FEEDBACK, name: 'Manager Feedback', icon: 'user-check', color: '#3B82F6', sortOrder: 5 },
      { code: SystemFeedbackCategory.TEAM_FEEDBACK, name: 'Team Feedback', icon: 'users', color: '#06B6D4', sortOrder: 6 },
      { code: SystemFeedbackCategory.WORKPLACE_ISSUE, name: 'Workplace Issue', icon: 'building', color: '#64748B', sortOrder: 7 },
      { code: SystemFeedbackCategory.PAYROLL_BENEFITS, name: 'Payroll/Benefits', icon: 'dollar-sign', color: '#22C55E', sortOrder: 8 },
      { code: SystemFeedbackCategory.FACILITY_EQUIPMENT, name: 'Facility/Equipment', icon: 'tool', color: '#78716C', sortOrder: 9 },
      { code: SystemFeedbackCategory.POLICY_PROCESS, name: 'Policy/Process', icon: 'file-text', color: '#6366F1', sortOrder: 10 },
      { code: SystemFeedbackCategory.HARASSMENT, name: 'Harassment', icon: 'shield-alert', color: '#DC2626', sortOrder: 11, defaultSensitivity: FeedbackSensitivity.CRITICAL },
      { code: SystemFeedbackCategory.ETHICS, name: 'Ethics', icon: 'scale', color: '#B91C1C', sortOrder: 12, defaultSensitivity: FeedbackSensitivity.SENSITIVE },
      { code: SystemFeedbackCategory.OTHER, name: 'Other', icon: 'more-horizontal', color: '#9CA3AF', sortOrder: 99 },
    ];

    for (const cat of systemCategories) {
      const existing = await this.categoryRepository.findByCode(companyId, cat.code);
      if (!existing) {
        await this.categoryRepository.save(
          this.categoryRepository.create({
            companyId,
            code: cat.code,
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
            sortOrder: cat.sortOrder,
            defaultSensitivity: cat.defaultSensitivity || FeedbackSensitivity.NORMAL,
            isSystem: true,
            allowAnonymous: true,
          }),
        );
      }
    }
  }
}
