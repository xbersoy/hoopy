import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AttendanceCorrectionRequest } from '../entities/attendance-correction-request.entity';
import {
  AttendanceCorrectionRepository,
  AttendanceRecordRepository,
} from '../attendance.repository';
import { CreateCorrectionRequestDto } from '../dto/create-correction-request.dto';
import { PaginatedResponse } from '../../../shared/dto/pagination.dto';
import { CorrectionStatus } from '../enums/attendance.enums';
import { PaginationDto } from '../../../shared/dto/pagination.dto';

@Injectable()
export class AttendanceCorrectionService {
  constructor(
    @Inject('AttendanceCorrectionRepository')
    private readonly correctionRepository: AttendanceCorrectionRepository,

    @Inject('AttendanceRecordRepository')
    private readonly recordRepository: AttendanceRecordRepository,
  ) {}

  async create(
    companyId: string,
    dto: CreateCorrectionRequestDto,
  ): Promise<AttendanceCorrectionRequest> {
    const entity = this.correctionRepository.create({
      companyId,
      employeeId: dto.employeeId,
      attendanceRecordId: dto.attendanceRecordId || null,
      date: new Date(dto.date),
      correctionType: dto.correctionType,
      requestedCheckIn: dto.requestedCheckIn ? new Date(dto.requestedCheckIn) : null,
      requestedCheckOut: dto.requestedCheckOut ? new Date(dto.requestedCheckOut) : null,
      reason: dto.reason,
      status: CorrectionStatus.PENDING,
      metadata: dto.metadata || null,
    });
    return this.correctionRepository.save(entity);
  }

  async findAll(
    companyId: string,
    query: PaginationDto & { employeeId?: string; status?: string },
  ): Promise<PaginatedResponse<AttendanceCorrectionRequest>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { data, total } = await this.correctionRepository.findPaginated({
      companyId,
      employeeId: query.employeeId,
      status: query.status,
      search: query.search,
      page,
      limit,
    });
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<AttendanceCorrectionRequest> {
    const entity = await this.correctionRepository.findOne(id);
    if (!entity) {
      throw new NotFoundException(`Correction request with ID "${id}" not found`);
    }
    return entity;
  }

  async approve(
    id: string,
    reviewerId: string,
    notes?: string,
  ): Promise<AttendanceCorrectionRequest> {
    const request = await this.findOne(id);
    if (request.status !== CorrectionStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be approved');
    }

    // Apply correction to attendance record
    if (request.attendanceRecordId) {
      const record = await this.recordRepository.findOne(request.attendanceRecordId);
      if (record) {
        if (request.requestedCheckIn) record.checkIn = request.requestedCheckIn;
        if (request.requestedCheckOut) record.checkOut = request.requestedCheckOut;

        // Recalculate worked minutes
        if (record.checkIn && record.checkOut) {
          const checkInTime = new Date(record.checkIn).getTime();
          const checkOutTime = new Date(record.checkOut).getTime();
          record.workedMinutes = Math.round((checkOutTime - checkInTime) / 60000);
        }

        await this.recordRepository.save(record);
      }
    }

    request.status = CorrectionStatus.APPROVED;
    request.reviewerId = reviewerId;
    request.reviewedAt = new Date();
    request.reviewNotes = notes || null;
    return this.correctionRepository.save(request);
  }

  async reject(
    id: string,
    reviewerId: string,
    notes?: string,
  ): Promise<AttendanceCorrectionRequest> {
    const request = await this.findOne(id);
    if (request.status !== CorrectionStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be rejected');
    }

    request.status = CorrectionStatus.REJECTED;
    request.reviewerId = reviewerId;
    request.reviewedAt = new Date();
    request.reviewNotes = notes || null;
    return this.correctionRepository.save(request);
  }

  async cancel(id: string): Promise<AttendanceCorrectionRequest> {
    const request = await this.findOne(id);
    if (request.status !== CorrectionStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be cancelled');
    }

    request.status = CorrectionStatus.CANCELLED;
    return this.correctionRepository.save(request);
  }
}
