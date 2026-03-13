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
import { NationalIdType } from '../enums/national-id-type.enum';
import { EncryptedColumnTransformer } from '../../infrastructure/common/encrypted-column.transformer';

@Entity('employee_national_ids')
export class EmployeeNationalId {
  @ApiProperty({
    description: 'Unique identifier for the national ID record',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Type of national identification',
    enum: NationalIdType,
    example: NationalIdType.PASSPORT,
  })
  @Column({
    type: 'enum',
    enum: NationalIdType,
    nullable: false,
  })
  idType: NationalIdType;

  @ApiProperty({
    description: 'The identification number (stored encrypted)',
    example: 'AB1234567',
  })
  @Column({
    nullable: false,
    transformer: new EncryptedColumnTransformer(),
  })
  idNumber: string;

  @ApiProperty({
    description: 'Country that issued the ID (ISO country code)',
    example: 'US',
    required: false,
  })
  @Column({ nullable: true })
  country: string;

  @ApiProperty({
    description: 'Date the ID was issued',
    example: '2020-01-15',
    required: false,
  })
  @Column({ nullable: true, type: 'date' })
  issueDate: Date;

  @ApiProperty({
    description: 'Date the ID expires',
    example: '2030-01-15',
    required: false,
  })
  @Column({ nullable: true, type: 'date' })
  expirationDate: Date;

  @ApiProperty({
    description: 'Authority that issued the ID',
    example: 'US Department of State',
    required: false,
  })
  @Column({ nullable: true })
  issuingAuthority: string;

  @ApiProperty({
    description: 'The employee associated with this national ID',
    type: () => Employee,
  })
  @ManyToOne(() => Employee, (employee) => employee.nationalIds, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @ApiProperty({
    description: 'ID of the employee associated with this national ID',
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
