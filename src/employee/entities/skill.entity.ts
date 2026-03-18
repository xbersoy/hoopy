import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Company } from '../../company/entities/company.entity';
import { SkillType } from './skill-type.entity';
import { EmployeeSkill } from './employee-skill.entity';

@Entity('skills')
export class Skill {
  @ApiProperty({
    description: 'Unique identifier for the skill',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Company ID this skill belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ApiProperty({
    description: 'Skill type ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ name: 'skill_type_id' })
  skillTypeId: string;

  @ApiProperty({
    description: 'The skill type this skill belongs to',
    type: () => SkillType,
  })
  @ManyToOne(() => SkillType, (skillType) => skillType.skills, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'skill_type_id' })
  skillType: SkillType;

  @ApiProperty({
    description: 'Optional code/slug for the skill',
    example: 'TYPESCRIPT',
    required: false,
  })
  @Column({ nullable: true })
  code: string;

  @ApiProperty({
    description: 'Name of the skill',
    example: 'TypeScript',
  })
  @Column({ nullable: false })
  name: string;

  @ApiProperty({
    description: 'Description of the skill',
    example: 'TypeScript programming language',
    required: false,
  })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({
    description: 'Whether the skill is active',
    example: true,
  })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Employee skills linked to this skill',
    type: () => [EmployeeSkill],
  })
  @OneToMany(() => EmployeeSkill, (employeeSkill) => employeeSkill.skill)
  employeeSkills: EmployeeSkill[];

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
