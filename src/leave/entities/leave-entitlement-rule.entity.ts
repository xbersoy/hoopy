import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { LeavePolicy } from './leave-policy.entity';
import {
  GrantStrategy,
  GrantTrigger,
  RelativeAnchor,
  CarryoverStrategy,
  ExpiryStrategy,
  RecurringPattern,
  ConsumptionStrategy,
} from '../enums/leave.enums';

@Entity('leave_entitlement_rules')
export class LeaveEntitlementRule {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'leave_policy_id', type: 'uuid' })
  @Index()
  leavePolicyId: string;

  @ManyToOne(() => LeavePolicy, (p) => p.entitlementRules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'leave_policy_id' })
  policy: LeavePolicy;

  @ApiProperty({
    description: 'Human-readable name',
    example: '14 days yearly',
  })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({ description: 'Grant strategy', enum: GrantStrategy })
  @Column({ type: 'varchar', length: 50 })
  grantStrategy: GrantStrategy;

  @ApiProperty({ description: 'Amount to grant', example: 14 })
  @Column({ type: 'decimal', precision: 8, scale: 2 })
  grantAmount: number;

  @ApiProperty({ description: 'Grant trigger', enum: GrantTrigger })
  @Column({ type: 'varchar', length: 50 })
  grantTrigger: GrantTrigger;

  @ApiProperty({
    description: 'Relative anchor for validity window',
    enum: RelativeAnchor,
    required: false,
  })
  @Column({ type: 'varchar', length: 50, nullable: true })
  relativeAnchor: RelativeAnchor | null;

  @ApiProperty({ description: 'Start offset in days from anchor' })
  @Column({ type: 'int', default: 0 })
  relativeStartOffsetDays: number;

  @ApiProperty({
    description: 'End offset in days from anchor (null = no end)',
    required: false,
  })
  @Column({ type: 'int', nullable: true })
  relativeEndOffsetDays: number | null;

  @ApiProperty({
    description: 'Recurring pattern',
    enum: RecurringPattern,
    required: false,
  })
  @Column({ type: 'varchar', length: 20, nullable: true })
  recurringPattern: RecurringPattern | null;

  @ApiProperty({
    description: 'Max grants per employee (null = unlimited)',
    required: false,
  })
  @Column({ type: 'int', nullable: true })
  maxGrantsPerEmployee: number | null;

  @ApiProperty({ description: 'Carryover strategy', enum: CarryoverStrategy })
  @Column({ type: 'varchar', length: 20, default: CarryoverStrategy.NONE })
  carryoverStrategy: CarryoverStrategy;

  @ApiProperty({
    description: 'Max days for carryover (when capped)',
    required: false,
  })
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  carryoverMaxDays: number | null;

  @ApiProperty({ description: 'Expiry strategy', enum: ExpiryStrategy })
  @Column({
    type: 'varchar',
    length: 50,
    default: ExpiryStrategy.END_OF_PERIOD,
  })
  expiryStrategy: ExpiryStrategy;

  @ApiProperty({
    description: 'Fixed days after grant for expiry',
    required: false,
  })
  @Column({ type: 'int', nullable: true })
  expiryDays: number | null;

  @ApiProperty({
    description: 'Consumption priority strategy',
    enum: ConsumptionStrategy,
  })
  @Column({
    type: 'varchar',
    length: 50,
    default: ConsumptionStrategy.EARLIEST_EXPIRING_FIRST,
  })
  consumptionStrategy: ConsumptionStrategy;

  @ApiProperty({ description: 'Whether negative balance is allowed' })
  @Column({ default: false })
  allowNegativeBalance: boolean;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
