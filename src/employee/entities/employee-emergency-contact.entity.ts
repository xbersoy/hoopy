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
import { Relationship } from '../enums/relationship.enum';

@Entity('employee_emergency_contacts')
export class EmployeeEmergencyContact {
  @ApiProperty({
    description: 'Unique identifier for the emergency contact record',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Full name of the emergency contact',
    example: 'Jane Doe',
  })
  @Column({ nullable: false })
  fullName: string;

  @ApiProperty({
    description: 'Relationship to the employee',
    enum: Relationship,
    example: Relationship.SPOUSE,
  })
  @Column({
    type: 'enum',
    enum: Relationship,
    nullable: false,
  })
  relationship: Relationship;

  @ApiProperty({
    description: 'Phone number of the emergency contact',
    example: '+1234567890',
  })
  @Column({ nullable: false })
  phone: string;

  @ApiProperty({
    description: 'Email address of the emergency contact',
    example: 'jane.doe@example.com',
    required: false,
  })
  @Column({ nullable: true })
  email: string;

  @ApiProperty({
    description: 'Address of the emergency contact',
    example: '123 Main St, Springfield, IL',
    required: false,
  })
  @Column({ nullable: true })
  address: string;

  @ApiProperty({
    description: 'Whether this is the primary emergency contact',
    example: false,
  })
  @Column({ default: false })
  isPrimary: boolean;

  @ApiProperty({
    description: 'The employee associated with this emergency contact',
    type: () => Employee,
  })
  @ManyToOne(() => Employee, (employee) => employee.emergencyContacts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @ApiProperty({
    description: 'ID of the employee associated with this emergency contact',
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
