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
import { LicenseCertificationType } from '../enums/license-certification-type.enum';

@Entity('employee_licenses_certifications')
export class EmployeeLicenseCertification {
  @ApiProperty({
    description: 'Unique identifier for the license/certification record',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Name of the license or certification',
    example: 'AWS Solutions Architect',
  })
  @Column({ nullable: false })
  name: string;

  @ApiProperty({
    description: 'Type of credential',
    enum: LicenseCertificationType,
    example: LicenseCertificationType.CERTIFICATION,
  })
  @Column({
    type: 'enum',
    enum: LicenseCertificationType,
    nullable: false,
  })
  type: LicenseCertificationType;

  @ApiProperty({
    description: 'Organization that issued the credential',
    example: 'Amazon Web Services',
    required: false,
  })
  @Column({ nullable: true })
  issuingOrganization: string;

  @ApiProperty({
    description: 'Date the credential was issued',
    example: '2023-01-15',
    required: false,
  })
  @Column({ nullable: true, type: 'date' })
  issueDate: Date;

  @ApiProperty({
    description: 'Date the credential expires',
    example: '2026-01-15',
    required: false,
  })
  @Column({ nullable: true, type: 'date' })
  expirationDate: Date;

  @ApiProperty({
    description: 'Credential ID or license number',
    example: 'AWS-SAA-C03-12345',
    required: false,
  })
  @Column({ nullable: true })
  credentialId: string;

  @ApiProperty({
    description: 'Additional description of the credential',
    example: 'Associate level certification for cloud architecture',
    required: false,
  })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({
    description: 'The employee associated with this credential',
    type: () => Employee,
  })
  @ManyToOne(() => Employee, (employee) => employee.licensesCertifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @ApiProperty({
    description: 'ID of the employee associated with this credential',
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
