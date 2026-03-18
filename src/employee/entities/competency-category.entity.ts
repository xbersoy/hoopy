import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Company } from '../../company/entities/company.entity';
import { Competency } from './competency.entity';

@Entity('competency_categories')
export class CompetencyCategory {
  @ApiProperty({
    description: 'Unique identifier for the competency category',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Company ID this competency category belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ApiProperty({
    description: 'Optional code/slug for the competency category',
    example: 'BEHAVIORAL',
    required: false,
  })
  @Column({ nullable: true })
  code: string;

  @ApiProperty({
    description: 'Name of the competency category',
    example: 'Behavioral',
  })
  @Column({ nullable: false })
  name: string;

  @ApiProperty({
    description: 'Description of the competency category',
    example: 'Competencies related to workplace behaviors and interpersonal skills',
    required: false,
  })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({
    description: 'Whether the competency category is active',
    example: true,
  })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Sort order for display purposes',
    example: 1,
    required: false,
  })
  @Column({ name: 'sort_order', nullable: true })
  sortOrder: number;

  @ApiProperty({
    description: 'Competencies belonging to this category',
    type: () => [Competency],
  })
  @OneToMany(() => Competency, (competency) => competency.competencyCategory)
  competencies: Competency[];

  @ApiProperty({
    description: 'Date when the record was created',
    example: '2023-01-15T12:00:00Z',
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({
    description: 'Date when the record was last updated',
    example: '2023-01-16T12:00:00Z',
  })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
