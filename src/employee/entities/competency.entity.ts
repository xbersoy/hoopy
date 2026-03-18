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
import { CompetencyCategory } from './competency-category.entity';
import { EmployeeCompetency } from './employee-competency.entity';

@Entity('competencies')
export class Competency {
  @ApiProperty({
    description: 'Unique identifier for the competency',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Company ID this competency belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ApiProperty({
    description: 'Competency category ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @Column({ name: 'competency_category_id', nullable: true })
  competencyCategoryId: string;

  @ManyToOne(() => CompetencyCategory, (category) => category.competencies, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'competency_category_id' })
  competencyCategory: CompetencyCategory;

  @ApiProperty({
    description: 'Optional code/slug for the competency',
    example: 'LEADERSHIP',
    required: false,
  })
  @Column({ nullable: true })
  code: string;

  @ApiProperty({
    description: 'Name of the competency',
    example: 'Leadership',
  })
  @Column({ nullable: false })
  name: string;

  @ApiProperty({
    description: 'Description of the competency',
    example: 'Ability to lead and inspire teams',
    required: false,
  })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({
    description: 'Category of the competency (legacy text field)',
    example: 'Behavioral',
    required: false,
    deprecated: true,
  })
  @Column({ nullable: true })
  category: string;

  @ApiProperty({
    description: 'Whether the competency is active',
    example: true,
  })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Employee competency assessments linked to this competency',
    type: () => [EmployeeCompetency],
  })
  @OneToMany(
    () => EmployeeCompetency,
    (employeeCompetency) => employeeCompetency.competency,
  )
  employeeCompetencies: EmployeeCompetency[];

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
