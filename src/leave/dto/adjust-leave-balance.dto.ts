import { IsUUID, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdjustLeaveBalanceDto {
  @ApiProperty({ description: 'Employee ID' })
  @IsUUID()
  employeeId: string;

  @ApiProperty({ description: 'Leave type ID' })
  @IsUUID()
  leaveTypeId: string;

  @ApiProperty({
    description: 'Adjustment amount (positive or negative)',
    example: 2,
  })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Reason for adjustment' })
  @IsString()
  reason: string;

  @ApiProperty({
    description: 'Specific grant ID to adjust (optional)',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  grantId?: string;
}
