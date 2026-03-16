import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsUUID } from 'class-validator';

export class UpdateCustomObjectRecordDto {
  @ApiProperty({
    description: 'Record data as key-value pairs (field_code -> value)',
    example: { vehicle_id: 'FORD-002', is_active: false },
  })
  @IsObject()
  data: Record<string, any>;

  @ApiProperty({
    description: 'Optional User ID who owns this specific record',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  ownerId?: string;

  @ApiProperty({
    description: 'Optional Permission Group ID that owns this specific record',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  ownerGroupId?: string;
}
