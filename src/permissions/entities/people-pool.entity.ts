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
import { PermissionGroup } from './permission-group.entity';
import { PeoplePoolCondition } from './people-pool-condition.entity';

@Entity('people_pools')
export class PeoplePool {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'permission_group_id' })
  permissionGroupId: string;

  @ManyToOne(() => PermissionGroup, (g) => g.peoplePools, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'permission_group_id' })
  permissionGroup: PermissionGroup;

  @ApiProperty({
    description: 'Pool type',
    example: 'included',
    enum: ['included', 'excluded'],
  })
  @Column({ name: 'pool_type', length: 20, default: 'included' })
  poolType: 'included' | 'excluded';

  @OneToMany(() => PeoplePoolCondition, (c) => c.peoplePool, { cascade: true })
  conditions: PeoplePoolCondition[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
