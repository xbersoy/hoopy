import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ScheduleTemplate } from '../entities/schedule-template.entity';
import {
  IScheduleTemplateRepository,
  IScheduleTemplateI18nRepository,
} from '../schedules.repository';
import {
  CreateScheduleTemplateDto,
  UpdateScheduleTemplateDto,
} from '../dto/create-schedule-template.dto';

@Injectable()
export class ScheduleTemplateService {
  constructor(
    @Inject('ScheduleTemplateRepository')
    private readonly templateRepo: IScheduleTemplateRepository,
    @Inject('ScheduleTemplateI18nRepository')
    private readonly i18nRepo: IScheduleTemplateI18nRepository,
  ) {}

  async create(
    companyId: string,
    dto: CreateScheduleTemplateDto,
  ): Promise<ScheduleTemplate> {
    const existing = await this.templateRepo.findByCode(companyId, dto.code);
    if (existing) {
      throw new ConflictException(
        `Schedule template with code "${dto.code}" already exists`,
      );
    }

    const entity = this.templateRepo.create({
      companyId,
      code: dto.code,
      name: dto.name,
      description: dto.description ?? null,
      scheduleType: dto.scheduleType,
      workDays: dto.workDays ?? [],
      defaultStartTime: dto.defaultStartTime ?? null,
      defaultEndTime: dto.defaultEndTime ?? null,
      breakDurationMinutes: dto.breakDurationMinutes ?? 60,
      isOvernight: dto.isOvernight ?? false,
      weeklyHours: dto.weeklyHours ?? null,
      metadata: dto.metadata ?? null,
    });
    const saved = await this.templateRepo.save(entity);

    if (dto.translations) {
      await this.upsertTranslations(companyId, saved.id, dto.translations);
    }

    return this.templateRepo.findOne(saved.id) as Promise<ScheduleTemplate>;
  }

  async findAll(companyId: string): Promise<ScheduleTemplate[]> {
    return this.templateRepo.findByCompany(companyId);
  }

  async findOne(id: string): Promise<ScheduleTemplate> {
    const entity = await this.templateRepo.findOne(id);
    if (!entity) {
      throw new NotFoundException(
        `Schedule template with ID "${id}" not found`,
      );
    }
    return entity;
  }

  async update(
    id: string,
    dto: UpdateScheduleTemplateDto,
  ): Promise<ScheduleTemplate> {
    const entity = await this.findOne(id);

    if (dto.name !== undefined) entity.name = dto.name;
    if (dto.description !== undefined)
      entity.description = dto.description ?? null;
    if (dto.scheduleType !== undefined) entity.scheduleType = dto.scheduleType;
    if (dto.workDays !== undefined) entity.workDays = dto.workDays;
    if (dto.defaultStartTime !== undefined)
      entity.defaultStartTime = dto.defaultStartTime ?? null;
    if (dto.defaultEndTime !== undefined)
      entity.defaultEndTime = dto.defaultEndTime ?? null;
    if (dto.breakDurationMinutes !== undefined)
      entity.breakDurationMinutes = dto.breakDurationMinutes;
    if (dto.isOvernight !== undefined) entity.isOvernight = dto.isOvernight;
    if (dto.weeklyHours !== undefined)
      entity.weeklyHours = dto.weeklyHours ?? null;
    if (dto.isActive !== undefined) entity.isActive = dto.isActive;
    if (dto.metadata !== undefined) entity.metadata = dto.metadata ?? null;

    await this.templateRepo.save(entity);

    if (dto.translations) {
      await this.upsertTranslations(entity.companyId, id, dto.translations);
    }

    return this.templateRepo.findOne(id) as Promise<ScheduleTemplate>;
  }

  async remove(id: string): Promise<ScheduleTemplate> {
    const entity = await this.findOne(id);
    return this.templateRepo.remove(entity);
  }

  private async upsertTranslations(
    companyId: string,
    scheduleTemplateId: string,
    translations: Record<string, { name: string; description?: string }>,
  ): Promise<void> {
    for (const [locale, data] of Object.entries(translations)) {
      await this.i18nRepo.upsert(companyId, scheduleTemplateId, locale, data);
    }
  }
}
