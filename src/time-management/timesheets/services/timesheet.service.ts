import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TimesheetPeriod } from '../entities/timesheet-period.entity';
import {
  TimesheetPeriodRepository,
  TimesheetEntryRepository,
} from '../timesheets.repository';
import {
  CreateTimesheetPeriodDto,
  CreateTimesheetEntryDto,
  QueryTimesheetDto,
} from '../dto/create-timesheet.dto';
import { PaginatedResponse } from '../../../shared/dto/pagination.dto';
import { TimesheetStatus } from '../enums/timesheet.enums';

@Injectable()
export class TimesheetService {
  constructor(
    @Inject('TimesheetPeriodRepository')
    private readonly periodRepository: TimesheetPeriodRepository,

    @Inject('TimesheetEntryRepository')
    private readonly entryRepository: TimesheetEntryRepository,
  ) {}

  async create(
    companyId: string,
    dto: CreateTimesheetPeriodDto,
  ): Promise<TimesheetPeriod> {
    const overlapping = await this.periodRepository.findOverlapping(
      companyId,
      dto.employeeId,
      new Date(dto.periodStart),
      new Date(dto.periodEnd),
    );
    if (overlapping.length > 0) {
      throw new BadRequestException(
        'An overlapping timesheet period already exists for this employee',
      );
    }

    const entity = this.periodRepository.create({
      companyId,
      employeeId: dto.employeeId,
      periodStart: new Date(dto.periodStart),
      periodEnd: new Date(dto.periodEnd),
      status: TimesheetStatus.DRAFT,
    });
    return this.periodRepository.save(entity);
  }

  async findAll(
    companyId: string,
    query: QueryTimesheetDto,
  ): Promise<PaginatedResponse<TimesheetPeriod>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { data, total } = await this.periodRepository.findPaginated({
      companyId,
      employeeId: query.employeeId,
      status: query.status,
      search: query.search,
      page,
      limit,
    });
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<TimesheetPeriod> {
    const entity = await this.periodRepository.findOne(id);
    if (!entity) {
      throw new NotFoundException(`Timesheet period with ID "${id}" not found`);
    }
    return entity;
  }

  async addEntries(
    id: string,
    entries: CreateTimesheetEntryDto[],
  ): Promise<TimesheetPeriod> {
    const period = await this.findOne(id);
    if (
      period.status !== TimesheetStatus.DRAFT &&
      period.status !== TimesheetStatus.CORRECTION_REQUESTED
    ) {
      throw new BadRequestException(
        'Entries can only be added to DRAFT or CORRECTION_REQUESTED timesheets',
      );
    }

    const entryEntities = entries.map((e) =>
      this.entryRepository.create({
        timesheetPeriodId: id,
        date: new Date(e.date),
        startTime: e.startTime ? new Date(e.startTime) : null,
        endTime: e.endTime ? new Date(e.endTime) : null,
        workedMinutes: e.workedMinutes,
        breakMinutes: e.breakMinutes ?? 0,
        overtimeMinutes: e.overtimeMinutes ?? 0,
        description: e.description || null,
        projectCode: e.projectCode || null,
        taskCode: e.taskCode || null,
      }),
    );
    await this.entryRepository.saveAll(entryEntities);

    // Recalculate totals
    const updated = await this.findOne(id);
    updated.totalWorkedMinutes = (updated.entries || []).reduce(
      (sum, entry) => sum + entry.workedMinutes,
      0,
    );
    updated.totalOvertimeMinutes = (updated.entries || []).reduce(
      (sum, entry) => sum + entry.overtimeMinutes,
      0,
    );
    return this.periodRepository.save(updated);
  }

  async submit(id: string): Promise<TimesheetPeriod> {
    const period = await this.findOne(id);
    if (
      period.status !== TimesheetStatus.DRAFT &&
      period.status !== TimesheetStatus.CORRECTION_REQUESTED
    ) {
      throw new BadRequestException('Only DRAFT or CORRECTION_REQUESTED timesheets can be submitted');
    }

    period.status = TimesheetStatus.SUBMITTED;
    period.submittedAt = new Date();
    return this.periodRepository.save(period);
  }

  async approve(id: string, approverUserId: string): Promise<TimesheetPeriod> {
    const period = await this.findOne(id);
    if (period.status !== TimesheetStatus.SUBMITTED) {
      throw new BadRequestException('Only SUBMITTED timesheets can be approved');
    }

    period.status = TimesheetStatus.APPROVED;
    period.approvedAt = new Date();
    period.approvedBy = approverUserId;
    return this.periodRepository.save(period);
  }

  async reject(id: string, reason: string): Promise<TimesheetPeriod> {
    const period = await this.findOne(id);
    if (period.status !== TimesheetStatus.SUBMITTED) {
      throw new BadRequestException('Only SUBMITTED timesheets can be rejected');
    }

    period.status = TimesheetStatus.REJECTED;
    period.rejectedAt = new Date();
    period.rejectionReason = reason;
    return this.periodRepository.save(period);
  }

  async requestCorrection(id: string, reason: string): Promise<TimesheetPeriod> {
    const period = await this.findOne(id);
    if (period.status !== TimesheetStatus.SUBMITTED) {
      throw new BadRequestException(
        'Only SUBMITTED timesheets can have corrections requested',
      );
    }

    period.status = TimesheetStatus.CORRECTION_REQUESTED;
    period.rejectionReason = reason;
    return this.periodRepository.save(period);
  }

  async lock(id: string): Promise<TimesheetPeriod> {
    const period = await this.findOne(id);
    if (period.status !== TimesheetStatus.APPROVED) {
      throw new BadRequestException('Only APPROVED timesheets can be locked');
    }

    period.status = TimesheetStatus.LOCKED;
    period.isLocked = true;
    return this.periodRepository.save(period);
  }

  async remove(id: string): Promise<TimesheetPeriod> {
    const period = await this.findOne(id);
    if (period.status !== TimesheetStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT timesheets can be deleted');
    }

    await this.entryRepository.deleteByPeriodId(id);
    return this.periodRepository.remove(period);
  }
}
