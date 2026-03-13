import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsObject, IsOptional } from 'class-validator';

export class CreateCustomObjectRecordDto {
  @ApiProperty({
    description: 'Definition ID this record belongs to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  definitionId: string;

  @ApiProperty({
    description: 'Base object ID this record is linked to (e.g. employee UUID)',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  baseObjectId?: string;

  @ApiProperty({ description: 'Optional User ID who owns this specific record', required: false })
  @IsUUID()
  @IsOptional()
  ownerId?: string;

  @ApiProperty({ description: 'Optional Permission Group ID that owns this specific record', required: false })
  @IsUUID()
  @IsOptional()
  ownerGroupId?: string;

  @ApiProperty({
    description: 'Record data as key-value pairs (field_code -> value)',
    example: { vehicle_id: 'FORD-001', assign_date: '2024-01-15' },
  })
  @IsObject()
  data: Record<string, any>;
}
