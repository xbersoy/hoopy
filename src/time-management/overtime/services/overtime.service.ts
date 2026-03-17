import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { OvertimeRequest } from '../entities/overtime-request.entity';
import {
  OvertimeRequestRepository,
  CompOffGrantRepository,
} from '../overtime.repository';
import {
  CreateOvertimeRequestDto,
  ReviewOvertimeRequestDto,
  QueryOvertimeDto,
} from '../dto/create-overtime.dto';
import { PaginatedResponse } from '../../../shared/dto/pagination.dto';
import { OvertimeStatus, CompensationType, CompOffStatus } from '../enums/overtime.enums';

@Injectable()
export class OvertimeService {
  constructor(
    @Inject('OvertimeRequestRepository')
    private readonly requestRepository: OvertimeRequestRepository,

    @Inject('CompOffGrantRepository')
    private readonly compOffRepository: CompOffGrantRepository,
  ) {}

  async create(
    companyId: string,
    dto: CreateOvertimeRequestDto,
  ): Promise<OvertimeRequest> {
    const entity = this.requestRepository.create({
      companyId,
      employeeId: dto.employeeId,
      date: new Date(dto.date),
      plannedMinutes: dto.plannedMinutes,
      reason: dto.reason,
      compensationType: dto.compensationType,
      status: OvertimeStatus.PENDING,
    });
    return this.requestRepository.save(entity);
  }

  async findAll(
    companyId: string,
    query: QueryOvertimeDto,
  ): Promise<PaginatedResponse<OvertimeRequest>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { data, total } = await this.requestRepository.findPaginated({
      companyId,
      employeeId: query.employeeId,
      status: query.status,
      search: query.search,
      page,
      limit,
    });
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<OvertimeRequest> {
    const entity = await this.requestRepository.findOne(id);
    if (!entity) {
      throw new NotFoundException(`Overtime request with ID "${id}" not found`);
    }
    return entity;
  }

  async approve(
    id: string,
    reviewerId: string,
    dto: ReviewOvertimeRequestDto,
  ): Promise<OvertimeRequest> {
    const request = await this.findOne(id);
    if (request.status !== OvertimeStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be approved');
    }

    request.status = OvertimeStatus.APPROVED;
    request.reviewerId = reviewerId;
    request.reviewedAt = new Date();
    request.reviewNotes = dto.notes || null;
    if (dto.actualMinutes !== undefined) {
      request.actualMinutes = dto.actualMinutes;
    }

    const saved = await this.requestRepository.save(request);

    // Auto-create comp-off grant if compensation type is COMP_OFF or BOTH
    if (
      request.compensationType === CompensationType.COMP_OFF ||
      request.compensationType === CompensationType.BOTH
    ) {
      const minutes = request.actualMinutes ?? request.plannedMinutes;
      const grantedDays = Math.round((minutes / 480) * 100) / 100; // 8-hour workday
      const grant = this.compOffRepository.create({
        companyId: request.companyId,
        employeeId: request.employeeId,
        overtimeRequestId: request.id,
        grantedDays,
        consumedDays: 0,
        remainingDays: grantedDays,
        validFrom: request.date,
        status: CompOffStatus.ACTIVE,
      });
      await this.compOffRepository.save(grant);
    }

    return saved;
  }

  async reject(
    id: string,
    reviewerId: string,
    notes?: string,
  ): Promise<OvertimeRequest> {
    const request = await this.findOne(id);
    if (request.status !== OvertimeStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be rejected');
    }

    request.status = OvertimeStatus.REJECTED;
    request.reviewerId = reviewerId;
    request.reviewedAt = new Date();
    request.reviewNotes = notes || null;
    return this.requestRepository.save(request);
  }

  async cancel(id: string): Promise<OvertimeRequest> {
    const request = await this.findOne(id);
    if (request.status !== OvertimeStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be cancelled');
    }

    request.status = OvertimeStatus.CANCELLED;
    return this.requestRepository.save(request);
  }

  async complete(id: string, actualMinutes: number): Promise<OvertimeRequest> {
    const request = await this.findOne(id);
    if (request.status !== OvertimeStatus.APPROVED) {
      throw new BadRequestException('Only approved requests can be completed');
    }

    request.status = OvertimeStatus.COMPLETED;
    request.actualMinutes = actualMinutes;
    return this.requestRepository.save(request);
  }
}
