import { IsOptional, IsUUID, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MoveOrgUnitDto {
  @ApiProperty({
    description: 'New parent ID. Pass null or omit to move to root.',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  newParentId?: string | null;

  @ApiProperty({
    description: 'New sort order among siblings',
    required: false,
  })
  @IsOptional()
  @IsInt()
  newSortOrder?: number;
}
