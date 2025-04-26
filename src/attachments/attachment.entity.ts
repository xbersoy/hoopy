import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('attachments')
export class Attachment {
  @ApiProperty({
    description: 'Unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Public URL to access attachment',
    example: 'https://your-bucket.supabase.co/storage/v1/object/public/hoopy/file.pdf'
  })
  @Column()
  url: string;

  @ApiProperty({
    description: 'Original file name',
    example: 'document.pdf'
  })
  @Column()
  fileName: string;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'application/pdf'
  })
  @Column()
  mimeType: string;

  @ApiProperty({
    description: 'Size of the file in bytes',
    example: 1024
  })
  @Column()
  size: number;

  @ApiProperty({
    description: 'Type of associated entity',
    example: 'employee'
  })
  @Column()
  relatedType: string;

  @ApiProperty({
    description: 'ID of associated entity',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @Column('uuid')
  relatedId: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-03-15T12:00:00Z'
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Update timestamp',
    example: '2024-03-15T12:00:00Z'
  })
  @UpdateDateColumn()
  updatedAt: Date;
} 