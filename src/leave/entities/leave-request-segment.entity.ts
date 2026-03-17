import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { LeaveRequest } from './leave-request.entity';
import { LeaveGrant } from './leave-grant.entity';
import { SessionType } from '../enums/leave.enums';

@Entity('leave_request_segments')
@Index('IDX_segment_request', ['leaveRequestId'])
export class LeaveRequestSegment {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'leave_request_id', type: 'uuid' })
  leaveRequestId: string;

  @ManyToOne(() => LeaveRequest, (r) => r.segments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'leave_request_id' })
  leaveRequest: LeaveRequest;

  @ApiProperty({ description: 'Date of this segment' })
  @Column({ type: 'date' })
  date: Date;

  @ApiProperty({ description: 'Session type for this day', enum: SessionType })
  @Column({ type: 'varchar', length: 20, default: SessionType.FULL_DAY })
  sessionType: SessionType;

  @ApiProperty({ description: 'Duration in days (1 for full, 0.5 for half)' })
  @Column({ type: 'decimal', precision: 4, scale: 2, default: 1 })
  durationDays: number;

  @ApiProperty({ description: 'Whether this segment counts against balance' })
  @Column({ default: true })
  countsAgainstBalance: boolean;

  @ApiProperty({ description: 'Grant allocated for this segment', required: false })
  @Column({ name: 'applied_grant_id', type: 'uuid', nullable: true })
  appliedGrantId: string | null;

  @ManyToOne(() => LeaveGrant, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'applied_grant_id' })
  appliedGrant: LeaveGrant;
}
