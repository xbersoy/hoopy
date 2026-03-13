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
import { PeoplePool } from './people-pool.entity';

@Entity('people_pool_conditions')
export class PeoplePoolCondition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'people_pool_id' })
  peoplePoolId: string;

  @ManyToOne(() => PeoplePool, (p) => p.conditions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'people_pool_id' })
  peoplePool: PeoplePool;

  @ApiProperty({
    description: 'Employee field to match',
    example: 'department',
  })
  @Column({ length: 100, nullable: false })
  field: string;

  @ApiProperty({
    description: 'Values to match against',
    example: ['Engineering', 'Product'],
  })
  @Column({ type: 'jsonb', default: [] })
  values: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
