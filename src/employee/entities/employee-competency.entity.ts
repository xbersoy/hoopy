import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Company } from '../../company/entities/company.entity';
import { Employee } from './employee.entity';
import { Competency } from './competency.entity';
import { User } from '../../user/entities/user.entity';
import { AssessmentSource } from '../enums/assessment-source.enum';

@Entity('employee_competencies')
export class EmployeeCompetency {
  @ApiProperty({
    description: 'Unique identifier for the employee competency record',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Company ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ApiProperty({
    description: 'Employee ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ name: 'employee_id' })
  employeeId: string;

  @ApiProperty({
    description: 'The employee this competency assessment belongs to',
    type: () => Employee,
  })
  @ManyToOne(() => Employee, (employee) => employee.employeeCompetencies, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @ApiProperty({
    description: 'Competency ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ name: 'competency_id' })
  competencyId: string;

  @ApiProperty({
    description: 'The competency',
    type: () => Competency,
  })
  @ManyToOne(
    () => Competency,
    (competency) => competency.employeeCompetencies,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'competency_id' })
  competency: Competency;

  @ApiProperty({
    description: 'Rating (1-5)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @Column({ type: 'integer' })
  rating: number;

  @ApiProperty({
    description: 'Source of the assessment',
    enum: AssessmentSource,
    example: AssessmentSource.MANAGER,
  })
  @Column({
    name: 'assessment_source',
    type: 'enum',
    enum: AssessmentSource,
  })
  assessmentSource: AssessmentSource;

  @ApiProperty({
    description: 'Date when the assessment was made',
    example: '2024-01-15',
  })
  @Column({ name: 'assessed_at', type: 'date' })
  assessedAt: Date;

  @ApiProperty({
    description: 'User ID of the assessor',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @Column({ name: 'assessor_user_id', nullable: true })
  assessorUserId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assessor_user_id' })
  assessor: User;

  @ApiProperty({
    description: 'Additional notes',
    example: 'Demonstrated excellent leadership during Q4 project',
    required: false,
  })
  @Column({ nullable: true })
  notes: string;

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
