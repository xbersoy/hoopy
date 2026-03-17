import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { LeaveRequest } from '../entities/leave-request.entity';
import {
  LeaveRequestRepository,
  LeaveRequestSegmentRepository,
  LeaveGrantRepository,
  LeaveBalanceLedgerRepository,
} from '../leave.repository';
import { CreateLeaveRequestDto, UpdateLeaveRequestDto } from '../dto/create-leave-request.dto';
import { QueryLeaveRequestDto } from '../dto/query-leave.dto';
import { PaginatedResponse } from '../../shared/dto';
import {
  LeaveRequestStatus,
  SessionType,
  BalanceTransactionType,
  BalanceActorType,
  LeaveGrantStatus,
} from '../enums/leave.enums';
import { LeaveTypeService } from './leave-type.service';

@Injectable()
export class LeaveRequestService {
  constructor(
    @Inject('LeaveRequestRepository')
    private readonly requestRepository: LeaveRequestRepository,

    @Inject('LeaveRequestSegmentRepository')
    private readonly segmentRepository: LeaveRequestSegmentRepository,

    @Inject('LeaveGrantRepository')
    private readonly grantRepository: LeaveGrantRepository,

    @Inject('LeaveBalanceLedgerRepository')
    private readonly ledgerRepository: LeaveBalanceLedgerRepository,

    private readonly leaveTypeService: LeaveTypeService,
  ) {}

  async create(
    companyId: string,
    requesterUserId: string,
    dto: CreateLeaveRequestDto,
  ): Promise<LeaveRequest> {
    const leaveType = await this.leaveTypeService.findOne(dto.leaveTypeId);

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate > endDate) {
      throw new BadRequestException('Start date must be before or equal to end date');
    }

    // Check for overlapping requests
    const overlapping = await this.requestRepository.findOverlapping(
      dto.employeeId,
      startDate,
      endDate,
    );
    if (overlapping.length > 0) {
      throw new BadRequestException('Leave request overlaps with an existing request');
    }

    // Calculate duration and build segments
    const startSession = dto.startSession || SessionType.FULL_DAY;
    const endSession = dto.endSession || SessionType.FULL_DAY;
    const segments = this.buildSegments(startDate, endDate, startSession, endSession);
    const durationDays = segments.reduce((sum, s) => sum + s.durationDays, 0);

    // Check balance if required
    if (leaveType.requiresBalance) {
      const grants = await this.grantRepository.findActiveByEmployeeAndType(
        dto.employeeId,
        dto.leaveTypeId,
        startDate,
      );
      const availableBalance = grants.reduce(
        (sum, g) => sum + Number(g.remainingAmount),
        0,
      );
      if (availableBalance < durationDays) {
        throw new BadRequestException(
          `Insufficient balance. Available: ${availableBalance}, Requested: ${durationDays}`,
        );
      }
    }

    const request = this.requestRepository.create({
      companyId,
      employeeId: dto.employeeId,
      requesterUserId,
      leaveTypeId: dto.leaveTypeId,
      status: LeaveRequestStatus.DRAFT,
      startDate,
      endDate,
      startSession,
      endSession,
      durationDays,
      reason: dto.reason || null,
    });
    const saved = await this.requestRepository.save(request);

    // Save segments
    const segmentEntities = segments.map((s) =>
      this.segmentRepository.create({
        leaveRequestId: saved.id,
        date: s.date,
        sessionType: s.sessionType,
        durationDays: s.durationDays,
        countsAgainstBalance: true,
      }),
    );
    if (segmentEntities.length) {
      await this.segmentRepository.saveAll(segmentEntities);
    }

    return this.findOne(saved.id);
  }

  async findPaginated(
    companyId: string,
    query: QueryLeaveRequestDto,
  ): Promise<PaginatedResponse<LeaveRequest>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { data, total } = await this.requestRepository.findPaginated({
      companyId,
      employeeId: query.employeeId,
      status: query.status,
      leaveTypeId: query.leaveTypeId,
      search: query.search,
      page,
      limit,
    });
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<LeaveRequest> {
    const entity = await this.requestRepository.findOne(id);
    if (!entity) {
      throw new NotFoundException(`Leave request with ID "${id}" not found`);
    }
    return entity;
  }

  async submit(id: string, actorUserId: string): Promise<LeaveRequest> {
    const request = await this.findOne(id);
    if (request.status !== LeaveRequestStatus.DRAFT) {
      throw new BadRequestException('Only draft requests can be submitted');
    }

    // Reserve balance (earliest-expiring-first)
    if (request.leaveType?.requiresBalance !== false) {
      await this.reserveBalance(request, actorUserId);
    }

    request.status = LeaveRequestStatus.SUBMITTED;
    request.submittedAt = new Date();
    return this.requestRepository.save(request);
  }

  async approve(id: string, actorUserId: string): Promise<LeaveRequest> {
    const request = await this.findOne(id);
    if (request.status !== LeaveRequestStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted requests can be approved');
    }

    // Convert reservations to consumption
    await this.consumeReservedBalance(request, actorUserId);

    request.status = LeaveRequestStatus.APPROVED;
    request.approvedAt = new Date();
    return this.requestRepository.save(request);
  }

  async reject(id: string, actorUserId: string): Promise<LeaveRequest> {
    const request = await this.findOne(id);
    if (
      request.status !== LeaveRequestStatus.SUBMITTED
    ) {
      throw new BadRequestException('Only submitted requests can be rejected');
    }

    // Release reserved balance
    await this.releaseReservedBalance(request, actorUserId);

    request.status = LeaveRequestStatus.REJECTED;
    request.rejectedAt = new Date();
    return this.requestRepository.save(request);
  }

  async cancel(id: string, actorUserId: string): Promise<LeaveRequest> {
    const request = await this.findOne(id);
    if (
      request.status !== LeaveRequestStatus.DRAFT &&
      request.status !== LeaveRequestStatus.SUBMITTED &&
      request.status !== LeaveRequestStatus.APPROVED
    ) {
      throw new BadRequestException('This request cannot be cancelled');
    }

    // Release or reverse balance depending on status
    if (request.status === LeaveRequestStatus.SUBMITTED) {
      await this.releaseReservedBalance(request, actorUserId);
    } else if (request.status === LeaveRequestStatus.APPROVED) {
      await this.reverseConsumedBalance(request, actorUserId);
    }

    request.status = LeaveRequestStatus.CANCELLED;
    request.cancelledAt = new Date();
    return this.requestRepository.save(request);
  }

  // ─── Balance Operations ─────────────────────────────────────

  private async reserveBalance(request: LeaveRequest, actorUserId: string): Promise<void> {
    const grants = await this.grantRepository.findActiveByEmployeeAndType(
      request.employeeId,
      request.leaveTypeId,
      request.startDate,
    );

    let remaining = Number(request.durationDays);
    for (const grant of grants) {
      if (remaining <= 0) break;
      const available = Number(grant.remainingAmount);
      const toReserve = Math.min(available, remaining);

      grant.reservedAmount = Number(grant.reservedAmount) + toReserve;
      grant.remainingAmount = Number(grant.remainingAmount) - toReserve;
      await this.grantRepository.save(grant);

      await this.ledgerRepository.save(
        this.ledgerRepository.create({
          companyId: request.companyId,
          employeeId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          leaveGrantId: grant.id,
          leaveRequestId: request.id,
          transactionType: BalanceTransactionType.RESERVATION,
          amount: -toReserve,
          occurredAt: new Date(),
          effectiveDate: request.startDate,
          notes: `Reserved for leave request`,
          actorType: BalanceActorType.USER,
          actorId: actorUserId,
        }),
      );

      remaining -= toReserve;
    }
  }

  private async consumeReservedBalance(request: LeaveRequest, actorUserId: string): Promise<void> {
    const grants = await this.grantRepository.findActiveByEmployeeAndType(
      request.employeeId,
      request.leaveTypeId,
      request.startDate,
    );

    let remaining = Number(request.durationDays);
    for (const grant of grants) {
      if (remaining <= 0) break;
      const reserved = Number(grant.reservedAmount);
      if (reserved <= 0) continue;
      const toConsume = Math.min(reserved, remaining);

      grant.reservedAmount = Number(grant.reservedAmount) - toConsume;
      grant.consumedAmount = Number(grant.consumedAmount) + toConsume;
      await this.grantRepository.save(grant);

      await this.ledgerRepository.save(
        this.ledgerRepository.create({
          companyId: request.companyId,
          employeeId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          leaveGrantId: grant.id,
          leaveRequestId: request.id,
          transactionType: BalanceTransactionType.CONSUMPTION,
          amount: -toConsume,
          occurredAt: new Date(),
          effectiveDate: request.startDate,
          notes: `Consumed for approved leave request`,
          actorType: BalanceActorType.SYSTEM,
          actorId: actorUserId,
        }),
      );

      remaining -= toConsume;
    }
  }

  private async releaseReservedBalance(request: LeaveRequest, actorUserId: string): Promise<void> {
    const grants = await this.grantRepository.findActiveByEmployeeAndType(
      request.employeeId,
      request.leaveTypeId,
      request.startDate,
    );

    let remaining = Number(request.durationDays);
    for (const grant of grants) {
      if (remaining <= 0) break;
      const reserved = Number(grant.reservedAmount);
      if (reserved <= 0) continue;
      const toRelease = Math.min(reserved, remaining);

      grant.reservedAmount = Number(grant.reservedAmount) - toRelease;
      grant.remainingAmount = Number(grant.remainingAmount) + toRelease;
      await this.grantRepository.save(grant);

      await this.ledgerRepository.save(
        this.ledgerRepository.create({
          companyId: request.companyId,
          employeeId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          leaveGrantId: grant.id,
          leaveRequestId: request.id,
          transactionType: BalanceTransactionType.RELEASE,
          amount: toRelease,
          occurredAt: new Date(),
          effectiveDate: request.startDate,
          notes: `Released: request rejected/cancelled`,
          actorType: BalanceActorType.SYSTEM,
          actorId: actorUserId,
        }),
      );

      remaining -= toRelease;
    }
  }

  private async reverseConsumedBalance(request: LeaveRequest, actorUserId: string): Promise<void> {
    const grants = await this.grantRepository.findActiveByEmployeeAndType(
      request.employeeId,
      request.leaveTypeId,
      request.startDate,
    );

    let remaining = Number(request.durationDays);
    for (const grant of grants) {
      if (remaining <= 0) break;
      const consumed = Number(grant.consumedAmount);
      if (consumed <= 0) continue;
      const toReverse = Math.min(consumed, remaining);

      grant.consumedAmount = Number(grant.consumedAmount) - toReverse;
      grant.remainingAmount = Number(grant.remainingAmount) + toReverse;
      await this.grantRepository.save(grant);

      await this.ledgerRepository.save(
        this.ledgerRepository.create({
          companyId: request.companyId,
          employeeId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          leaveGrantId: grant.id,
          leaveRequestId: request.id,
          transactionType: BalanceTransactionType.REVERSAL,
          amount: toReverse,
          occurredAt: new Date(),
          effectiveDate: request.startDate,
          notes: `Reversed: approved request cancelled`,
          actorType: BalanceActorType.SYSTEM,
          actorId: actorUserId,
        }),
      );

      remaining -= toReverse;
    }
  }

  // ─── Segment Builder ────────────────────────────────────────

  private buildSegments(
    startDate: Date,
    endDate: Date,
    startSession: SessionType,
    endSession: SessionType,
  ): Array<{ date: Date; sessionType: SessionType; durationDays: number }> {
    const segments: Array<{ date: Date; sessionType: SessionType; durationDays: number }> = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const isStart = current.getTime() === startDate.getTime();
      const isEnd = current.getTime() === endDate.getTime();
      const isSingleDay = isStart && isEnd;

      let sessionType = SessionType.FULL_DAY;
      let durationDays = 1;

      if (isSingleDay) {
        sessionType = startSession;
        durationDays = startSession === SessionType.FULL_DAY ? 1 : 0.5;
      } else if (isStart && startSession !== SessionType.FULL_DAY) {
        sessionType = startSession;
        durationDays = 0.5;
      } else if (isEnd && endSession !== SessionType.FULL_DAY) {
        sessionType = endSession;
        durationDays = 0.5;
      }

      segments.push({ date: new Date(current), sessionType, durationDays });
      current.setDate(current.getDate() + 1);
    }

    return segments;
  }
}
