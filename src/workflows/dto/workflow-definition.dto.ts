import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsEnum,
  IsArray,
  IsUUID,
  ValidateNested,
  IsObject,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  WorkflowTriggerMode,
  WorkflowStepType,
  ApprovalStrategy,
  AssigneeStrategy,
  TransitionAction,
} from '../enums/workflow.enums';

// ─── I18n Translation DTO ───

export class WorkflowI18nDto {
  @ApiProperty({ description: 'BCP-47 locale', example: 'en' })
  @IsString()
  locale: string;

  @ApiProperty({ description: 'Localized name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Localized description', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

// ─── Step Definition DTO ───

export class CreateWorkflowStepDefinitionDto {
  @ApiProperty({ description: 'Unique code within the version', example: 'manager_approval' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Corresponding state machine transition code', required: false })
  @IsString()
  @IsOptional()
  transitionCode?: string;

  @ApiProperty({ description: 'Step type', enum: WorkflowStepType, default: WorkflowStepType.APPROVAL })
  @IsEnum(WorkflowStepType)
  @IsOptional()
  type?: WorkflowStepType;

  @ApiProperty({ description: 'Sort order', example: 1 })
  @IsInt()
  @Min(0)
  sortOrder: number;

  @ApiProperty({ description: 'Assignee strategy', enum: AssigneeStrategy })
  @IsEnum(AssigneeStrategy)
  assigneeStrategy: AssigneeStrategy;

  @ApiProperty({ description: 'Assignee strategy config', required: false })
  @IsObject()
  @IsOptional()
  assigneeConfig?: Record<string, any>;

  @ApiProperty({ description: 'Approval strategy', enum: ApprovalStrategy, required: false })
  @IsEnum(ApprovalStrategy)
  @IsOptional()
  approvalStrategy?: ApprovalStrategy;

  @ApiProperty({ description: 'Entry condition (JSON DSL)', required: false })
  @IsObject()
  @IsOptional()
  entryCondition?: Record<string, any>;

  @ApiProperty({ description: 'SLA duration in hours', required: false })
  @IsInt()
  @IsOptional()
  slaDurationHours?: number;

  @ApiProperty({ description: 'Escalation config', required: false })
  @IsObject()
  @IsOptional()
  escalationConfig?: Record<string, any>;

  @ApiProperty({ description: 'Whether comment is required', required: false })
  @IsBoolean()
  @IsOptional()
  isCommentRequired?: boolean;

  @ApiProperty({ description: 'Whether attachment is required', required: false })
  @IsBoolean()
  @IsOptional()
  isAttachmentRequired?: boolean;

  @ApiProperty({ description: 'Whether step is skippable', required: false })
  @IsBoolean()
  @IsOptional()
  isSkippable?: boolean;

  @ApiProperty({ description: 'Whether step auto-completes', required: false })
  @IsBoolean()
  @IsOptional()
  isAutoComplete?: boolean;

  @ApiProperty({ description: 'Auto-complete condition', required: false })
  @IsObject()
  @IsOptional()
  autoCompleteCondition?: Record<string, any>;

  @ApiProperty({ description: 'Form/task config', required: false })
  @IsObject()
  @IsOptional()
  formConfig?: Record<string, any>;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Translations', type: [WorkflowI18nDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowI18nDto)
  translations: WorkflowI18nDto[];
}

// ─── Transition Definition DTO ───

export class CreateWorkflowTransitionDefinitionDto {
  @ApiProperty({ description: 'Code of the from-step', example: 'manager_approval' })
  @IsString()
  fromStepCode: string;

  @ApiProperty({ description: 'Code of the to-step (null = workflow end)', required: false })
  @IsString()
  @IsOptional()
  toStepCode?: string;

  @ApiProperty({ description: 'Transition action', enum: TransitionAction })
  @IsEnum(TransitionAction)
  action: TransitionAction;

  @ApiProperty({ description: 'Condition for this transition', required: false })
  @IsObject()
  @IsOptional()
  condition?: Record<string, any>;

  @ApiProperty({ description: 'Priority (lower = first)', required: false })
  @IsInt()
  @IsOptional()
  priority?: number;

  @ApiProperty({ description: 'Is this the default route', required: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiProperty({ description: 'Label for this transition', required: false })
  @IsString()
  @IsOptional()
  label?: string;
}

// ─── Workflow Definition DTO ───

export class CreateWorkflowDefinitionDto {
  @ApiProperty({ description: 'Unique code within the company', example: 'leave_request_approval' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Target resource type', example: 'leave_request' })
  @IsString()
  resourceType: string;

  @ApiProperty({ description: 'State machine definition ID that governs this workflow\'s lifecycle' })
  @IsUUID()
  stateMachineDefinitionId: string;

  @ApiProperty({ description: 'Workflow category', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ description: 'Priority when multiple match', required: false })
  @IsInt()
  @IsOptional()
  priority?: number;

  @ApiProperty({ description: 'Trigger mode', enum: WorkflowTriggerMode, required: false })
  @IsEnum(WorkflowTriggerMode)
  @IsOptional()
  triggerMode?: WorkflowTriggerMode;

  @ApiProperty({ description: 'Entry criteria (JSON DSL)', required: false })
  @IsObject()
  @IsOptional()
  entryCriteria?: Record<string, any>;

  @ApiProperty({ description: 'Notification config', required: false })
  @IsObject()
  @IsOptional()
  notificationConfig?: Record<string, any>;

  @ApiProperty({ description: 'SLA config', required: false })
  @IsObject()
  @IsOptional()
  slaConfig?: Record<string, any>;

  @ApiProperty({ description: 'Behavior config', required: false })
  @IsObject()
  @IsOptional()
  behaviorConfig?: Record<string, any>;

  @ApiProperty({ description: 'Definition translations', type: [WorkflowI18nDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowI18nDto)
  translations: WorkflowI18nDto[];

  @ApiProperty({ description: 'Step definitions', type: [CreateWorkflowStepDefinitionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkflowStepDefinitionDto)
  steps: CreateWorkflowStepDefinitionDto[];

  @ApiProperty({ description: 'Transition definitions', type: [CreateWorkflowTransitionDefinitionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkflowTransitionDefinitionDto)
  transitions: CreateWorkflowTransitionDefinitionDto[];
}

export class UpdateWorkflowDefinitionDto {
  @ApiProperty({ description: 'Category', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ description: 'Is active', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'Priority', required: false })
  @IsInt()
  @IsOptional()
  priority?: number;
}

// ─── Version Draft Update DTO ───

export class UpdateWorkflowVersionDraftDto {
  @ApiProperty({ description: 'Trigger mode', enum: WorkflowTriggerMode, required: false })
  @IsEnum(WorkflowTriggerMode)
  @IsOptional()
  triggerMode?: WorkflowTriggerMode;

  @ApiProperty({ description: 'Entry criteria', required: false })
  @IsObject()
  @IsOptional()
  entryCriteria?: Record<string, any>;

  @ApiProperty({ description: 'Notification config', required: false })
  @IsObject()
  @IsOptional()
  notificationConfig?: Record<string, any>;

  @ApiProperty({ description: 'SLA config', required: false })
  @IsObject()
  @IsOptional()
  slaConfig?: Record<string, any>;

  @ApiProperty({ description: 'Behavior config', required: false })
  @IsObject()
  @IsOptional()
  behaviorConfig?: Record<string, any>;

  @ApiProperty({ description: 'Change notes', required: false })
  @IsString()
  @IsOptional()
  changeNotes?: string;

  @ApiProperty({ description: 'Steps', type: [CreateWorkflowStepDefinitionDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkflowStepDefinitionDto)
  @IsOptional()
  steps?: CreateWorkflowStepDefinitionDto[];

  @ApiProperty({ description: 'Transitions', type: [CreateWorkflowTransitionDefinitionDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkflowTransitionDefinitionDto)
  @IsOptional()
  transitions?: CreateWorkflowTransitionDefinitionDto[];
}
