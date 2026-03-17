import { Inject, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { LeaveType } from '../entities/leave-type.entity';
import { LeaveTypeRepository, LeaveTypeI18nRepository } from '../leave.repository';
import { CreateLeaveTypeDto, UpdateLeaveTypeDto } from '../dto/create-leave-type.dto';

@Injectable()
export class LeaveTypeService {
  constructor(
    @Inject('LeaveTypeRepository')
    private readonly leaveTypeRepository: LeaveTypeRepository,

    @Inject('LeaveTypeI18nRepository')
    private readonly i18nRepository: LeaveTypeI18nRepository,
  ) {}

  async create(companyId: string, dto: CreateLeaveTypeDto): Promise<LeaveType> {
    const existing = await this.leaveTypeRepository.findByCode(companyId, dto.code);
    if (existing) {
      throw new ConflictException(`Leave type with code "${dto.code}" already exists`);
    }

    const { translations, ...data } = dto;
    const entity = this.leaveTypeRepository.create({
      companyId,
      ...data,
    });
    const saved = await this.leaveTypeRepository.save(entity);

    // Upsert translations
    if (translations) {
      for (const [locale, t] of Object.entries(translations)) {
        await this.i18nRepository.upsert(companyId, saved.id, locale, t.name, t.description);
      }
    }

    return this.findOne(saved.id);
  }

  async findAll(companyId: string): Promise<LeaveType[]> {
    return this.leaveTypeRepository.findByCompany(companyId);
  }

  async findOne(id: string): Promise<LeaveType> {
    const entity = await this.leaveTypeRepository.findOne(id);
    if (!entity) {
      throw new NotFoundException(`Leave type with ID "${id}" not found`);
    }
    return entity;
  }

  async update(id: string, dto: UpdateLeaveTypeDto): Promise<LeaveType> {
    const entity = await this.findOne(id);
    if (entity.isSystem) {
      const allowed = ['name', 'description', 'isActive', 'sortOrder', 'color', 'icon', 'metadata', 'translations'];
      for (const key of Object.keys(dto)) {
        if (!allowed.includes(key)) {
          throw new ConflictException(`Cannot modify "${key}" on system leave types`);
        }
      }
    }

    const { translations, ...data } = dto;
    if (Object.keys(data).length > 0) {
      Object.assign(entity, data);
      await this.leaveTypeRepository.save(entity);
    }

    if (translations) {
      for (const [locale, t] of Object.entries(translations)) {
        await this.i18nRepository.upsert(entity.companyId!, id, locale, t.name, t.description);
      }
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<LeaveType> {
    const entity = await this.findOne(id);
    if (entity.isSystem) {
      throw new ConflictException('Cannot delete system leave types');
    }
    return this.leaveTypeRepository.remove(entity);
  }
}
