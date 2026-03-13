import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Employee } from './employee.entity';
import { ApiProperty } from '@nestjs/swagger';
import { EmploymentType } from '../enums/employment-type.enum';

@Entity('employee_job_informations')
export class EmployeeJobInformation {
  @ApiProperty({
    description: 'Unique identifier for the job information record',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Effective date of this job assignment',
    example: '2023-01-15',
  })
  @Column({ nullable: false, type: 'date' })
  effectiveDate: Date;

  @ApiProperty({
    description: 'End date of this job assignment',
    example: '2024-01-15',
    required: false,
  })
  @Column({ nullable: true, type: 'date' })
  endDate: Date;

  @ApiProperty({
    description: 'Job title for this assignment',
    example: 'Senior Software Engineer',
  })
  @Column({ nullable: false })
  jobTitle: string;

  @ApiProperty({
    description: 'Department for this assignment',
    example: 'Engineering',
    required: false,
  })
  @Column({ nullable: true })
  department: string;

  @ApiProperty({
    description: 'Work location for this assignment',
    example: 'New York Office',
    required: false,
  })
  @Column({ nullable: true })
  location: string;

  @ApiProperty({
    description: 'Employment type',
    enum: EmploymentType,
    example: EmploymentType.FULL_TIME,
  })
  @Column({
    type: 'enum',
    enum: EmploymentType,
    nullable: false,
  })
  employmentType: EmploymentType;

  @ApiProperty({
    description: 'ID of the reporting manager',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @Column({ nullable: true })
  managerId: string;

  @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'manager_id' })
  manager: Employee;

  @ApiProperty({
    description: 'Additional notes about this job assignment',
    example: 'Promoted from mid-level position',
    required: false,
  })
  @Column({ nullable: true })
  notes: string;

  @ApiProperty({
    description: 'The employee associated with this job information',
    type: () => Employee,
  })
  @ManyToOne(() => Employee, (employee) => employee.jobInformations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @ApiProperty({
    description: 'ID of the employee associated with this job information',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ nullable: false })
  employee_id: string;

  @ApiProperty({
    description: 'Date when the record was created',
    example: '2023-01-15T12:00:00Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Date when the record was last updated',
    example: '2023-01-16T12:00:00Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
