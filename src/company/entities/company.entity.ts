import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Account } from '../../account/entities/account.entity';
import { Employee } from '../../employee/entities/employee.entity';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
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

  @ApiProperty({
    description: 'Company settings',
    example: { branding: { color: '#ff0000' } },
    required: false,
  })
  @Column({ type: 'jsonb', nullable: true, default: {} })
  @IsOptional()
  settings?: Record<string, any>;

  @OneToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @OneToMany(() => Employee, (employee) => employee.company)
  employees?: Employee[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
