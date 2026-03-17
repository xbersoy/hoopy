import { IsOptional, IsUUID, IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationDto } from '../../shared/dto';
import { LeaveRequestStatus } from '../enums/leave.enums';

export class QueryLeaveRequestDto extends PaginationDto {
  @ApiProperty({ description: 'Filter by employee', required: false })
  @IsUUID()
  @IsOptional()
  employeeId?: string;

  @ApiProperty({ description: 'Filter by leave type', required: false })
  @IsUUID()
  @IsOptional()
  leaveTypeId?: string;

  @ApiProperty({ description: 'Filter by status', enum: LeaveRequestStatus, required: false })
  @IsEnum(LeaveRequestStatus)
  @IsOptional()
  status?: LeaveRequestStatus;
}

export class QueryLeaveGrantDto extends PaginationDto {
  @ApiProperty({ description: 'Filter by employee', required: false })
  @IsUUID()
  @IsOptional()
  employeeId?: string;

  @ApiProperty({ description: 'Filter by leave type', required: false })
  @IsUUID()
  @IsOptional()
  leaveTypeId?: string;
}
