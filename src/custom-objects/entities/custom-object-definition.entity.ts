import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Company } from '../../company/entities/company.entity';
import { CustomObjectField } from './custom-object-field.entity';
import { CustomObjectDefinitionI18n } from './custom-object-definition-i18n.entity';

@Entity('custom_object_definitions')
@Unique('UQ_cod_company_code', ['companyId', 'code'])
export class CustomObjectDefinition {
  @ApiProperty({
    description: 'Unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Company ID this definition belongs to' })
  @Column({ name: 'company_id', type: 'uuid' })
  @Index('IDX_cod_company_id')
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ApiProperty({
    description: 'Unique code within the company',
    example: 'vehicle_assignment',
  })
  @Column({ type: 'varchar', length: 100 })
  code: string;

  @ApiProperty({
    description: 'Display name',
    example: 'Vehicle Assignment',
  })
  @Column({ type: 'varchar', length: 255 })
  label: string;

  @ApiProperty({
    description: 'Description of this custom object',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({
    description: 'Base object type this entity is scoped to',
    example: 'EMPLOYEE',
    required: false,
    enum: ['EMPLOYEE', 'POSITION'],
  })
  @Column({
    name: 'base_object_type',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  baseObjectType: string | null;

  @ApiProperty({ description: 'Whether this object is active', default: true })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string | null;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string | null;

  @ApiProperty({
    description: 'Field definitions for this object',
    type: () => [CustomObjectField],
  })
  @OneToMany(() => CustomObjectField, (field) => field.definition, {
    cascade: true,
  })
  fields: CustomObjectField[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => CustomObjectDefinitionI18n, (i18n) => i18n.definition, {
    cascade: true,
  })
  translations: CustomObjectDefinitionI18n[];
}
