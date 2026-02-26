import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { IsString, IsNotEmpty, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ContactType {
  EMAIL = 'email',
  PHONE = 'phone',
  EMERGENCY_PHONE = 'emergency_phone',
  LINKEDIN = 'linkedin',
  OTHER = 'other'
}

@Entity('contacts')
export class Contact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Type of contact',
    enum: ContactType,
    example: ContactType.EMAIL
  })
  @Column({
    type: 'enum',
    enum: ContactType,
    nullable: false
  })
  @IsEnum(ContactType)
  @IsNotEmpty()
  type: ContactType;

  @ApiProperty({
    description: 'Contact value (e.g., email address or phone number)',
    example: 'john@example.com'
  })
  @Column({ nullable: false })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty({
    description: 'Optional label for the contact (e.g., "work", "personal")',
    example: 'work',
    required: false
  })
  @Column({ nullable: true })
  @IsString()
  label?: string;

  @ApiProperty({
    description: 'Whether this is the primary contact of its type',
    example: true
  })
  @Column({ default: false })
  @IsBoolean()
  isPrimary: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 