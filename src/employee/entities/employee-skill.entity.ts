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
import { Skill } from './skill.entity';
import { User } from '../../user/entities/user.entity';
import { ProficiencyLevel } from '../enums/proficiency-level.enum';

@Entity('employee_skills')
export class EmployeeSkill {
  @ApiProperty({
    description: 'Unique identifier for the employee skill record',
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
    description: 'The employee this skill belongs to',
    type: () => Employee,
  })
  @ManyToOne(() => Employee, (employee) => employee.employeeSkills, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @ApiProperty({
    description: 'Skill ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ name: 'skill_id' })
  skillId: string;

  @ApiProperty({
    description: 'The skill',
    type: () => Skill,
  })
  @ManyToOne(() => Skill, (skill) => skill.employeeSkills, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'skill_id' })
  skill: Skill;

  @ApiProperty({
    description: 'Proficiency level',
    enum: ProficiencyLevel,
    example: ProficiencyLevel.INTERMEDIATE,
  })
  @Column({
    name: 'proficiency_level',
    type: 'enum',
    enum: ProficiencyLevel,
  })
  proficiencyLevel: ProficiencyLevel;

  @ApiProperty({
    description: 'Years of experience with this skill',
    example: 3.5,
    required: false,
  })
  @Column({
    name: 'years_of_experience',
    type: 'numeric',
    precision: 4,
    scale: 1,
    nullable: true,
  })
  yearsOfExperience: number;

  @ApiProperty({
    description: 'Date when this skill was last used',
    example: '2024-01-15',
    required: false,
  })
  @Column({ name: 'last_used_at', type: 'date', nullable: true })
  lastUsedAt: Date;

  @ApiProperty({
    description: 'Whether this is the primary skill for the employee',
    example: false,
  })
  @Column({ name: 'is_primary', default: false })
  isPrimary: boolean;

  @ApiProperty({
    description: 'Whether this skill has been verified',
    example: false,
  })
  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @ApiProperty({
    description: 'User ID who verified the skill',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @Column({ name: 'verified_by', nullable: true })
  verifiedBy: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'verified_by' })
  verifier: User;

  @ApiProperty({
    description: 'Additional notes',
    example: 'Used extensively in project X',
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
