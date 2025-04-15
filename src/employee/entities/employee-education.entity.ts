import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from './employee.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('employee_educations')
export class EmployeeEducation {
  @ApiProperty({
    description: 'Unique identifier for the education record',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Name of the educational institution',
    example: 'Harvard University'
  })
  @Column({ nullable: false })
  institution: string;

  @ApiProperty({
    description: 'Degree obtained',
    example: 'Bachelor of Science'
  })
  @Column({ nullable: false })
  degree: string;

  @ApiProperty({
    description: 'Field of study',
    example: 'Computer Science',
    required: false
  })
  @Column({ nullable: true })
  fieldOfStudy: string;

  @ApiProperty({
    description: 'Start date of education',
    example: '2015-09-01',
    required: false
  })
  @Column({ nullable: true, type: 'date' })
  startDate: Date;

  @ApiProperty({
    description: 'End date of education',
    example: '2019-06-30',
    required: false
  })
  @Column({ nullable: true, type: 'date' })
  endDate: Date;

  @ApiProperty({
    description: 'Additional information about the education',
    example: 'Graduated with honors',
    required: false
  })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({
    description: 'The employee associated with this education record',
    type: () => Employee
  })
  @ManyToOne(() => Employee, employee => employee.educations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @ApiProperty({
    description: 'ID of the employee associated with this education record',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @Column({ nullable: false })
  employee_id: string;

  @ApiProperty({
    description: 'Date when the education record was created',
    example: '2023-01-15T12:00:00Z'
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Date when the education record was last updated',
    example: '2023-01-16T12:00:00Z'
  })
  @UpdateDateColumn()
  updatedAt: Date;
} 