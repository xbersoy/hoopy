import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Company name',
    example: 'Acme Inc.',
  })
  @Column({ nullable: false })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Company sector',
    example: 'Technology',
  })
  @Column({ nullable: false })
  @IsString()
  @IsNotEmpty()
  sector: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 