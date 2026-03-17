import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { EmployeeSchedule } from '../entities/employee-schedule.entity';
import { IEmployeeScheduleRepository } from '../schedules.repository';
import {
  CreateEmployeeScheduleDto,
  UpdateEmployeeScheduleDto,
  QueryEmployeeScheduleDto,
} from '../dto/create-employee-schedule.dto';
import { PaginatedResponse } from '../../../shared/dto/pagination.dto';

@Injectable()
export class EmployeeScheduleService {
  constructor(
    @Inject('EmployeeScheduleRepository')
    private readonly scheduleRepo: IEmployeeScheduleRepository,
  ) {}

  async create(
    companyId: string,
    dto: CreateEmployeeScheduleDto,
  ): Promise<EmployeeSchedule> {
    const effectiveFrom = new Date(dto.effectiveFrom);
    const effectiveUntil = dto.effectiveUntil
      ? new Date(dto.effectiveUntil)
      : undefined;

    const overlapping = await this.scheduleRepo.findOverlapping(
      companyId,
      dto.employeeId,
      effectiveFrom,
      effectiveUntil,
    );

    if (overlapping.length > 0) {
      throw new ConflictException(
        'Employee already has an overlapping schedule assignment for the given period',
      );
    }

    const entity = this.scheduleRepo.create({
      companyId,
      employeeId: dto.employeeId,
      scheduleTemplateId: dto.scheduleTemplateId,
      shiftTemplateId: dto.shiftTemplateId ?? null,
      effectiveFrom,
      effectiveUntil: effectiveUntil ?? null,
      notes: dto.notes ?? null,
    });

    return this.scheduleRepo.save(entity);
  }

  async findAll(
    companyId: string,
    query: QueryEmployeeScheduleDto,
  ): Promise<PaginatedResponse<EmployeeSchedule>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { data, total } = await this.scheduleRepo.findPaginated({
      companyId,
      employeeId: query.employeeId,
      scheduleTemplateId: query.scheduleTemplateId,
      isActive: query.isActive,
      search: query.search,
      page,
      limit,
    });
    return { data, total, page, limit };
  }

  async findByEmployee(
    companyId: string,
    employeeId: string,
  ): Promise<EmployeeSchedule[]> {
    return this.scheduleRepo.findByEmployee(companyId, employeeId);
  }

  async findOne(id: string): Promise<EmployeeSchedule> {
    const entity = await this.scheduleRepo.findOne(id);
    if (!entity) {
      throw new NotFoundException(
        `Employee schedule with ID "${id}" not found`,
      );
    }
    return entity;
  }

  async update(
    id: string,
    dto: UpdateEmployeeScheduleDto,
  ): Promise<EmployeeSchedule> {
    const entity = await this.findOne(id);

    if (dto.scheduleTemplateId !== undefined)
      entity.scheduleTemplateId = dto.scheduleTemplateId;
    if (dto.shiftTemplateId !== undefined)
      entity.shiftTemplateId = dto.shiftTemplateId ?? null;
    if (dto.effectiveFrom !== undefined)
      entity.effectiveFrom = new Date(dto.effectiveFrom);
    if (dto.effectiveUntil !== undefined)
      entity.effectiveUntil = dto.effectiveUntil
        ? new Date(dto.effectiveUntil)
        : null;
    if (dto.isActive !== undefined) entity.isActive = dto.isActive;
    if (dto.notes !== undefined) entity.notes = dto.notes ?? null;

    return this.scheduleRepo.save(entity);
  }

  async remove(id: string): Promise<EmployeeSchedule> {
    const entity = await this.findOne(id);
    return this.scheduleRepo.remove(entity);
  }
}
