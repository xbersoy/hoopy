import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('permissions')
@Unique(['action', 'resourceType'])
export class Permission {
  @ApiProperty({
    description: 'Unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Action type', example: 'read' })
  @Column({ length: 50, nullable: false })
  action: string;

  @ApiProperty({ description: 'Resource type', example: 'employee' })
  @Column({ name: 'resource_type', length: 100, nullable: false })
  resourceType: string;

  @ApiProperty({ description: 'Human-readable description', required: false })
  @Column({ length: 255, nullable: true })
  description?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
