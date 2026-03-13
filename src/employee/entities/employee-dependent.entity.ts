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
import { Gender } from '../enums/gender.enum';

@Entity('employee_dependents')
export class EmployeeDependent {
  @ApiProperty({
    description: 'Unique identifier for the dependent record',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Full name of the dependent',
    example: 'John Doe Jr.',
  })
  @Column({ nullable: false })
  fullName: string;

  @ApiProperty({
    description: 'Relationship to the employee',
    enum: Relationship,
    example: Relationship.CHILD,
  })
  @Column({
    type: 'enum',
    enum: Relationship,
    nullable: false,
  })
  relationship: Relationship;

  @ApiProperty({
    description: 'Date of birth of the dependent',
    example: '2010-05-15',
    required: false,
  })
  @Column({ nullable: true, type: 'date' })
  dateOfBirth: Date;

  @ApiProperty({
    description: 'Gender of the dependent',
    enum: Gender,
    example: Gender.MALE,
    required: false,
  })
  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  gender: Gender;

  @ApiProperty({
    description: 'National ID of the dependent',
    example: '12345678',
    required: false,
  })
  @Column({ nullable: true })
  nationalId: string;

  @ApiProperty({
    description: 'The employee associated with this dependent',
    type: () => Employee,
  })
  @ManyToOne(() => Employee, (employee) => employee.dependents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @ApiProperty({
    description: 'ID of the employee associated with this dependent',
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
