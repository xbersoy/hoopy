import { Inject, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { LeaveType } from '../entities/leave-type.entity';
import { LeaveTypeRepository } from '../leave.repository';
import { CreateLeaveTypeDto, UpdateLeaveTypeDto } from '../dto/create-leave-type.dto';

@Injectable()
export class LeaveTypeService {
  constructor(
    @Inject('LeaveTypeRepository')
    private readonly leaveTypeRepository: LeaveTypeRepository,
  ) {}

  async create(companyId: string, dto: CreateLeaveTypeDto): Promise<LeaveType> {
    const existing = await this.leaveTypeRepository.findByCode(companyId, dto.code);
    if (existing) {
      throw new ConflictException(`Leave type with code "${dto.code}" already exists`);
    }

    const entity = this.leaveTypeRepository.create({
      companyId,
      ...dto,
    });
    return this.leaveTypeRepository.save(entity);
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
      // Allow limited updates on system types (name, description, active, sort)
      const allowed = ['name', 'description', 'isActive', 'sortOrder', 'color', 'icon', 'metadata'];
      for (const key of Object.keys(dto)) {
        if (!allowed.includes(key)) {
          throw new ConflictException(`Cannot modify "${key}" on system leave types`);
        }
      }
    }
    Object.assign(entity, dto);
    return this.leaveTypeRepository.save(entity);
  }

  async remove(id: string): Promise<LeaveType> {
    const entity = await this.findOne(id);
    if (entity.isSystem) {
      throw new ConflictException('Cannot delete system leave types');
    }
    return this.leaveTypeRepository.remove(entity);
  }
}
