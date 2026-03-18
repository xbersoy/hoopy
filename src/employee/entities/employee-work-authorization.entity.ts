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
import { WorkAuthorizationType } from '../enums/work-authorization-type.enum';
import { WorkAuthorizationStatus } from '../enums/work-authorization-status.enum';

@Entity('employee_work_authorizations')
export class EmployeeWorkAuthorization {
  @ApiProperty({
    description: 'Unique identifier for the work authorization record',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Type of work authorization',
    enum: WorkAuthorizationType,
    example: WorkAuthorizationType.WORK_VISA,
  })
  @Column({
    name: 'authorizationType',
    type: 'enum',
    enum: WorkAuthorizationType,
    nullable: false,
  })
  authorizationType: WorkAuthorizationType;

  @ApiProperty({
    description: 'Current status of the work authorization',
    enum: WorkAuthorizationStatus,
    example: WorkAuthorizationStatus.ACTIVE,
  })
  @Column({
    type: 'enum',
    enum: WorkAuthorizationStatus,
    nullable: false,
    default: WorkAuthorizationStatus.ACTIVE,
  })
  status: WorkAuthorizationStatus;

  @ApiProperty({
    description: 'Document or authorization number',
    example: 'A123456789',
    required: false,
  })
  @Column({ name: 'documentNumber', nullable: true })
  documentNumber: string;

  @ApiProperty({
    description: 'Country that issued the authorization',
    example: 'United States',
    required: false,
  })
  @Column({ nullable: true })
  country: string;

  @ApiProperty({
    description: 'Date when the authorization was issued',
    example: '2022-01-15',
    required: false,
  })
  @Column({ name: 'issueDate', nullable: true, type: 'date' })
  issueDate: Date;

  @ApiProperty({
    description: 'Date when the authorization expires',
    example: '2025-01-15',
    required: false,
  })
  @Column({ name: 'expirationDate', nullable: true, type: 'date' })
  expirationDate: Date;

  @ApiProperty({
    description: 'Authority that issued the authorization',
    example: 'USCIS',
    required: false,
  })
  @Column({ name: 'issuingAuthority', nullable: true })
  issuingAuthority: string;

  @ApiProperty({
    description: 'Additional notes about the work authorization',
    example: 'H-1B visa sponsored by company',
    required: false,
  })
  @Column({ nullable: true, type: 'text' })
  notes: string;

  @ApiProperty({
    description: 'The employee associated with this work authorization',
    type: () => Employee,
  })
  @ManyToOne(() => Employee, (employee) => employee.workAuthorizations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @ApiProperty({
    description: 'ID of the employee associated with this work authorization',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ nullable: false })
  employee_id: string;

  @ApiProperty({
    description: 'Date when the record was created',
    example: '2023-01-15T12:00:00Z',
  })
  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @ApiProperty({
    description: 'Date when the record was last updated',
    example: '2023-01-16T12:00:00Z',
  })
  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
