import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { CustomObjectDefinition } from './custom-object-definition.entity';
import { CustomFieldType } from '../enums/custom-field-type.enum';
import { CustomObjectFieldI18n } from './custom-object-field-i18n.entity';

@Entity('custom_object_fields')
@Unique('UQ_cof_definition_code', ['definitionId', 'code'])
export class CustomObjectField {
  @ApiProperty({
    description: 'Unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Definition ID this field belongs to' })
  @Column({ name: 'definition_id', type: 'uuid' })
  @Index('IDX_cof_definition_id')
  definitionId: string;

  @ManyToOne(() => CustomObjectDefinition, (def) => def.fields, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'definition_id' })
  definition: CustomObjectDefinition;

  @ApiProperty({
    description: 'Unique field code within the definition',
    example: 'vehicle_id',
  })
  @Column({ type: 'varchar', length: 100 })
  code: string;

  @ApiProperty({ description: 'Display label', example: 'Vehicle ID' })
  @Column({ type: 'varchar', length: 255 })
  label: string;

  @ApiProperty({
    description: 'Field description',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({
    description: 'Data type of the field',
    enum: CustomFieldType,
    example: CustomFieldType.STRING,
  })
  @Column({ name: 'data_type', type: 'varchar', length: 20 })
  dataType: CustomFieldType;

  @ApiProperty({
    description: 'Whether this field is required',
    default: false,
  })
  @Column({ name: 'is_required', type: 'boolean', default: false })
  isRequired: boolean;

  @ApiProperty({
    description: 'Field visibility mode',
    example: 'EDIT',
    default: 'EDIT',
    enum: ['EDIT', 'READ', 'HIDE'],
  })
  @Column({ name: 'visibility', type: 'varchar', length: 10, default: 'EDIT' })
  visibility: string;

  @ApiProperty({ description: 'Sort order for display', default: 0 })
  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @ApiProperty({
    description: 'Options for SELECT type fields',
    required: false,
    example: ['Option A', 'Option B'],
  })
  @Column({ type: 'jsonb', nullable: true })
  options: string[] | null;

  @ApiProperty({
    description: 'Picklist ID for PICKLIST type',
    required: false,
  })
  @Column({ name: 'picklist_id', type: 'uuid', nullable: true })
  picklistId: string | null;

  @ApiProperty({
    description: 'Referenced Definition ID for CUSTOM_OBJECT type',
    required: false,
  })
  @Column({ name: 'referenced_definition_id', type: 'uuid', nullable: true })
  referencedDefinitionId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => CustomObjectFieldI18n, (i18n) => i18n.field, {
    cascade: true,
  })
  translations: CustomObjectFieldI18n[];
}
