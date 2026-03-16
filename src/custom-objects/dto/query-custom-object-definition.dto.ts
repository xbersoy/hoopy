import { PaginationDto } from '../../shared/dto';
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryCustomObjectDefinitionDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by base object type',
    example: 'EMPLOYEE',
  })
  @IsOptional()
  @IsString()
  baseObjectType?: string;
}
