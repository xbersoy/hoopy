import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { EmployeeEducation } from './employee-education.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('employees')
export class Employee {
  @ApiProperty({
    description: 'Unique identifier for the employee',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'First name of the employee',
    example: 'John'
  })
  @Column({ nullable: false })
  firstName: string;

  @ApiProperty({
    description: 'Last name of the employee',
    example: 'Doe'
  })
  @Column({ nullable: false })
  lastName: string;

  @ApiProperty({
    description: 'Email address of the employee',
    example: 'john.doe@example.com',
    required: false
  })
  @Column({ nullable: true })
  email: string;

  @ApiProperty({
    description: 'Phone number of the employee',
    example: '+1234567890',
    required: false
  })
  @Column({ nullable: true })
  phone: string;

  @ApiProperty({
    description: 'Job position of the employee',
    example: 'Software Engineer',
    required: false
  })
  @Column({ nullable: true })
  position: string;

  @ApiProperty({
    description: 'Department of the employee',
    example: 'Engineering',
    required: false
  })
  @Column({ nullable: true })
  department: string;

  @ApiProperty({
    description: 'Date when the employee was hired',
    example: '2020-01-15',
    required: false
  })
  @Column({ nullable: true, type: 'date' })
  hireDate: Date;

  @ApiProperty({
    description: 'Educational background of the employee',
    type: [EmployeeEducation],
    required: false,
    isArray: true
  })
  @OneToMany(() => EmployeeEducation, (education) => education.employee, { cascade: true })
  educations: EmployeeEducation[];

  @ApiProperty({
    description: 'Date when the employee record was created',
    example: '2023-01-15T12:00:00Z'
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Date when the employee record was last updated',
    example: '2023-01-16T12:00:00Z'
  })
  @UpdateDateColumn()
  updatedAt: Date;
} 