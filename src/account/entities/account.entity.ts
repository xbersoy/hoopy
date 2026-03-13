import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Account name',
    example: 'My Account',
  })
  @Column({ nullable: false })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Account type',
    example: 'Personal',
  })
  @Column({ nullable: false })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    description: 'Account settings',
    example: { theme: 'dark', language: 'en' },
    required: false,
  })
  @Column({ type: 'jsonb', nullable: true, default: {} })
  @IsOptional()
  settings?: Record<string, any>;

  @OneToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
