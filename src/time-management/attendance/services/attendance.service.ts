import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceRecord } from '../entities/attendance-record.entity';
import { AttendanceRecordRepository } from '../attendance.repository';
import {
  CreateAttendanceRecordDto,
  UpdateAttendanceRecordDto,
  QueryAttendanceDto,
} from '../dto/create-attendance-record.dto';
import { PaginatedResponse } from '../../../shared/dto/pagination.dto';
import { AttendanceStatus, CheckSource } from '../enums/attendance.enums';
import { Employee } from '../../../employee/entities/employee.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @Inject('AttendanceRecordRepository')
    private readonly recordRepository: AttendanceRecordRepository,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
  ) {}

  private async resolveEmployeeId(userId: string, companyId: string): Promise<string> {
    const employee = await this.employeeRepo.findOne({
      where: { user: { id: userId }, company: { id: companyId } },
    });
    if (!employee) {
      throw new BadRequestException('No employee record linked to the current user');
    }
    return employee.id;
  }

  async checkIn(
    companyId: string,
    userId: string,
    dto: { source?: CheckSource; notes?: string },
  ): Promise<AttendanceRecord> {
    const employeeId = await this.resolveEmployeeId(userId, companyId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if a record already exists for today
    const existing = await this.recordRepository.findByEmployee(
      companyId,
      employeeId,
      today,
      today,
    );

    if (existing.length > 0) {
      const record = existing[0];
      if (record.checkIn) {
        throw new BadRequestException('Already checked in for today');
      }
      record.checkIn = new Date();
      record.checkInSource = dto.source || CheckSource.WEB;
      record.status = AttendanceStatus.PRESENT;
      if (dto.notes) record.notes = dto.notes;
      return this.recordRepository.save(record);
    }

    const record = this.recordRepository.create({
      companyId,
      employeeId,
      date: today,
      status: AttendanceStatus.PRESENT,
      checkIn: new Date(),
      checkInSource: dto.source || CheckSource.WEB,
      notes: dto.notes || null,
    });
    return this.recordRepository.save(record);
  }

  async checkOut(
    companyId: string,
    userId: string,
    dto: { source?: CheckSource; notes?: string },
  ): Promise<AttendanceRecord> {
    const employeeId = await this.resolveEmployeeId(userId, companyId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.recordRepository.findByEmployee(
      companyId,
      employeeId,
      today,
      today,
    );

    if (existing.length === 0 || !existing[0].checkIn) {
      throw new BadRequestException('No check-in found for today');
    }

    const record = existing[0];
    if (record.checkOut) {
      throw new BadRequestException('Already checked out for today');
    }

    record.checkOut = new Date();
    record.checkOutSource = dto.source || CheckSource.WEB;
    if (dto.notes) record.notes = dto.notes;

    // Calculate worked minutes
    const checkInTime = new Date(record.checkIn).getTime();
    const checkOutTime = record.checkOut.getTime();
    record.workedMinutes = Math.round((checkOutTime - checkInTime) / 60000);

    return this.recordRepository.save(record);
  }

  async findAll(
    companyId: string,
    query: QueryAttendanceDto,
  ): Promise<PaginatedResponse<AttendanceRecord>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { data, total } = await this.recordRepository.findPaginated({
      companyId,
      employeeId: query.employeeId,
      status: query.status,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      search: query.search,
      page,
      limit,
    });
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<AttendanceRecord> {
    const entity = await this.recordRepository.findOne(id);
    if (!entity) {
      throw new NotFoundException(`Attendance record with ID "${id}" not found`);
    }
    return entity;
  }

  async findByEmployee(
    companyId: string,
    employeeId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<AttendanceRecord[]> {
    return this.recordRepository.findByEmployee(
      companyId,
      employeeId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  async createManual(
    companyId: string,
    dto: CreateAttendanceRecordDto,
  ): Promise<AttendanceRecord> {
    const record = this.recordRepository.create({
      companyId,
      employeeId: dto.employeeId,
      date: new Date(dto.date),
      status: dto.status || AttendanceStatus.PRESENT,
      checkIn: dto.checkIn ? new Date(dto.checkIn) : null,
      checkOut: dto.checkOut ? new Date(dto.checkOut) : null,
      checkInSource: dto.checkInSource || CheckSource.MANUAL,
      checkOutSource: dto.checkOutSource || CheckSource.MANUAL,
      breakMinutes: dto.breakMinutes ?? null,
      isOvernight: dto.isOvernight ?? false,
      timezone: dto.timezone || null,
      notes: dto.notes || null,
      metadata: dto.metadata || null,
    });

    // Calculate worked minutes if both check-in and check-out are provided
    if (record.checkIn && record.checkOut) {
      const checkInTime = new Date(record.checkIn).getTime();
      const checkOutTime = new Date(record.checkOut).getTime();
      record.workedMinutes = Math.round((checkOutTime - checkInTime) / 60000);
    }

    return this.recordRepository.save(record);
  }

  async update(
    id: string,
    dto: UpdateAttendanceRecordDto,
  ): Promise<AttendanceRecord> {
    const record = await this.findOne(id);

    if (dto.status !== undefined) record.status = dto.status;
    if (dto.checkIn !== undefined) record.checkIn = dto.checkIn ? new Date(dto.checkIn) : null;
    if (dto.checkOut !== undefined) record.checkOut = dto.checkOut ? new Date(dto.checkOut) : null;
    if (dto.checkInSource !== undefined) record.checkInSource = dto.checkInSource;
    if (dto.checkOutSource !== undefined) record.checkOutSource = dto.checkOutSource;
    if (dto.breakMinutes !== undefined) record.breakMinutes = dto.breakMinutes;
    if (dto.overtimeMinutes !== undefined) record.overtimeMinutes = dto.overtimeMinutes;
    if (dto.lateMinutes !== undefined) record.lateMinutes = dto.lateMinutes;
    if (dto.earlyDepartureMinutes !== undefined) record.earlyDepartureMinutes = dto.earlyDepartureMinutes;
    if (dto.isOvernight !== undefined) record.isOvernight = dto.isOvernight;
    if (dto.timezone !== undefined) record.timezone = dto.timezone;
    if (dto.notes !== undefined) record.notes = dto.notes;
    if (dto.metadata !== undefined) record.metadata = dto.metadata;

    // Recalculate worked minutes if times changed
    if (record.checkIn && record.checkOut) {
      const checkInTime = new Date(record.checkIn).getTime();
      const checkOutTime = new Date(record.checkOut).getTime();
      record.workedMinutes = Math.round((checkOutTime - checkInTime) / 60000);
    }

    return this.recordRepository.save(record);
  }

  async remove(id: string): Promise<AttendanceRecord> {
    const record = await this.findOne(id);
    return this.recordRepository.remove(record);
  }
}
