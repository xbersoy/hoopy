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
import { CustomObjectDefinition } from './custom-object-definition.entity';
import { Company } from '../../company/entities/company.entity';

@Entity('custom_object_records')
export class CustomObjectRecord {
  @ApiProperty({
    description: 'Unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Definition ID this record belongs to' })
  @Column({ name: 'definition_id', type: 'uuid' })
  @Index('IDX_cor_definition_id')
  definitionId: string;

  @ManyToOne(() => CustomObjectDefinition, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'definition_id' })
  definition: CustomObjectDefinition;

  @ApiProperty({ description: 'Company ID' })
  @Column({ name: 'company_id', type: 'uuid' })
  @Index('IDX_cor_company_id')
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ApiProperty({
    description: 'Base object ID (e.g. employee UUID) this record is linked to',
    required: false,
  })
  @Column({ name: 'base_object_id', type: 'uuid', nullable: true })
  @Index('IDX_cor_base_object_id')
  baseObjectId: string | null;

  @ApiProperty({
    description: 'Record data as key-value pairs (field_code -> value)',
    example: { vehicle_id: 'FORD-001', assign_date: '2024-01-15' },
  })
  @Column({ type: 'jsonb', default: {} })
  data: Record<string, any>;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string | null;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string | null;

  @ApiProperty({
    description:
      'Optional User ID who owns this specific record for RBP instance-level access',
    required: false,
  })
  @Column({ name: 'owner_id', type: 'uuid', nullable: true })
  ownerId: string | null;

  @ApiProperty({
    description:
      'Optional Permission Group ID that owns this specific record for RBP instance-level access',
    required: false,
  })
  @Column({ name: 'owner_group_id', type: 'uuid', nullable: true })
  ownerGroupId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
