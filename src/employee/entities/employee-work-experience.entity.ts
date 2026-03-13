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

@Entity('employee_work_experiences')
export class EmployeeWorkExperience {
  @ApiProperty({
    description: 'Unique identifier for the work experience record',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Name of the company',
    example: 'Acme Corp',
  })
  @Column({ nullable: false })
  companyName: string;

  @ApiProperty({
    description: 'Job title held at the company',
    example: 'Senior Software Engineer',
  })
  @Column({ nullable: false })
  jobTitle: string;

  @ApiProperty({
    description: 'Start date of employment',
    example: '2018-01-15',
  })
  @Column({ nullable: false, type: 'date' })
  startDate: Date;

  @ApiProperty({
    description: 'End date of employment',
    example: '2022-06-30',
    required: false,
  })
  @Column({ nullable: true, type: 'date' })
  endDate: Date;

  @ApiProperty({
    description: 'Location of the company',
    example: 'San Francisco, CA',
    required: false,
  })
  @Column({ nullable: true })
  location: string;

  @ApiProperty({
    description: 'Description of responsibilities and achievements',
    example: 'Led a team of 5 engineers building microservices',
    required: false,
  })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({
    description: 'Reason for leaving the company',
    example: 'Career growth opportunity',
    required: false,
  })
  @Column({ nullable: true })
  reasonForLeaving: string;

  @ApiProperty({
    description: 'The employee associated with this work experience',
    type: () => Employee,
  })
  @ManyToOne(() => Employee, (employee) => employee.workExperiences, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @ApiProperty({
    description: 'ID of the employee associated with this work experience',
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
