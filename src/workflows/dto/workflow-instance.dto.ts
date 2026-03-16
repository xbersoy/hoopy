import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsObject } from 'class-validator';

export class StartWorkflowDto {
  @ApiProperty({ description: 'Workflow definition code', example: 'leave_request_approval' })
  @IsString()
  workflowCode: string;

  @ApiProperty({ description: 'Resource type', example: 'leave_request' })
  @IsString()
  resourceType: string;

  @ApiProperty({ description: 'Resource ID' })
  @IsUUID()
  resourceId: string;

  @ApiProperty({ description: 'Subject employee/user ID (if applicable)', required: false })
  @IsUUID()
  @IsOptional()
  subjectId?: string;

  @ApiProperty({ description: 'Context data for condition evaluation and assignee resolution', required: false })
  @IsObject()
  @IsOptional()
  context?: Record<string, any>;
}

export class WorkflowStepActionDto {
  @ApiProperty({ description: 'Decision: approve, reject, return, complete, skip' })
  @IsString()
  decision: string;

  @ApiProperty({ description: 'Comment for this action', required: false })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiProperty({ description: 'Additional metadata/form data', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ReassignStepDto {
  @ApiProperty({ description: 'New assignee user ID' })
  @IsUUID()
  newAssigneeId: string;

  @ApiProperty({ description: 'Reason for reassignment', required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class CancelWorkflowDto {
  @ApiProperty({ description: 'Reason for cancellation', required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}
