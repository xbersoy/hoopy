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
import { Skill } from './skill.entity';

@Entity('skill_types')
export class SkillType {
  @ApiProperty({
    description: 'Unique identifier for the skill type',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Company ID this skill type belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ApiProperty({
    description: 'Optional code/slug for the skill type',
    example: 'TECH',
    required: false,
  })
  @Column({ nullable: true })
  code: string;

  @ApiProperty({
    description: 'Name of the skill type',
    example: 'Technical',
  })
  @Column({ nullable: false })
  name: string;

  @ApiProperty({
    description: 'Description of the skill type',
    example: 'Technical and engineering skills',
    required: false,
  })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({
    description: 'Whether the skill type is active',
    example: true,
  })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Sort order for display',
    example: 1,
    required: false,
  })
  @Column({ name: 'sort_order', nullable: true })
  sortOrder: number;

  @ApiProperty({
    description: 'Skills belonging to this type',
    type: () => [Skill],
  })
  @OneToMany(() => Skill, (skill) => skill.skillType)
  skills: Skill[];

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
