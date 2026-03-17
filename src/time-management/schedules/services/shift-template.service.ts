import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ShiftTemplate } from '../entities/shift-template.entity';
import {
  IShiftTemplateRepository,
  IShiftTemplateI18nRepository,
} from '../schedules.repository';
import {
  CreateShiftTemplateDto,
  UpdateShiftTemplateDto,
} from '../dto/create-shift-template.dto';

@Injectable()
export class ShiftTemplateService {
  constructor(
    @Inject('ShiftTemplateRepository')
    private readonly templateRepo: IShiftTemplateRepository,
    @Inject('ShiftTemplateI18nRepository')
    private readonly i18nRepo: IShiftTemplateI18nRepository,
  ) {}

  async create(
    companyId: string,
    dto: CreateShiftTemplateDto,
  ): Promise<ShiftTemplate> {
    const existing = await this.templateRepo.findByCode(companyId, dto.code);
    if (existing) {
      throw new ConflictException(`Shift template with code "${dto.code}" already exists`);
    }

    const entity = this.templateRepo.create({
      companyId,
      code: dto.code,
      name: dto.name,
      description: dto.description ?? null,
      startTime: dto.startTime,
      endTime: dto.endTime,
      breakDurationMinutes: dto.breakDurationMinutes ?? 60,
      isOvernight: dto.isOvernight ?? false,
      color: dto.color ?? null,
      metadata: dto.metadata ?? null,
    });
    const saved = await this.templateRepo.save(entity);

    if (dto.translations) {
      await this.upsertTranslations(companyId, saved.id, dto.translations);
    }

    return this.templateRepo.findOne(saved.id) as Promise<ShiftTemplate>;
  }

  async findAll(companyId: string): Promise<ShiftTemplate[]> {
    return this.templateRepo.findByCompany(companyId);
  }

  async findOne(id: string): Promise<ShiftTemplate> {
    const entity = await this.templateRepo.findOne(id);
    if (!entity) {
      throw new NotFoundException(`Shift template with ID "${id}" not found`);
    }
    return entity;
  }

  async update(
    id: string,
    dto: UpdateShiftTemplateDto,
  ): Promise<ShiftTemplate> {
    const entity = await this.findOne(id);

    if (dto.name !== undefined) entity.name = dto.name;
    if (dto.description !== undefined) entity.description = dto.description ?? null;
    if (dto.startTime !== undefined) entity.startTime = dto.startTime;
    if (dto.endTime !== undefined) entity.endTime = dto.endTime;
    if (dto.breakDurationMinutes !== undefined) entity.breakDurationMinutes = dto.breakDurationMinutes;
    if (dto.isOvernight !== undefined) entity.isOvernight = dto.isOvernight;
    if (dto.color !== undefined) entity.color = dto.color ?? null;
    if (dto.isActive !== undefined) entity.isActive = dto.isActive;
    if (dto.metadata !== undefined) entity.metadata = dto.metadata ?? null;

    await this.templateRepo.save(entity);

    if (dto.translations) {
      await this.upsertTranslations(entity.companyId, id, dto.translations);
    }

    return this.templateRepo.findOne(id) as Promise<ShiftTemplate>;
  }

  async remove(id: string): Promise<ShiftTemplate> {
    const entity = await this.findOne(id);
    return this.templateRepo.remove(entity);
  }

  private async upsertTranslations(
    companyId: string,
    shiftTemplateId: string,
    translations: Record<string, { name: string; description?: string }>,
  ): Promise<void> {
    for (const [locale, data] of Object.entries(translations)) {
      await this.i18nRepo.upsert(companyId, shiftTemplateId, locale, data);
    }
  }
}
