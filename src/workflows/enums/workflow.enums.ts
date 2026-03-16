// ─── Workflow Definition Status ───
export enum WorkflowDefinitionStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

// ─── Workflow Instance Status ───
export enum WorkflowInstanceStatus {
  /** Instance created but first step not yet activated */
  PENDING = 'pending',
  /** At least one step is active */
  IN_PROGRESS = 'in_progress',
  /** All required approvals completed successfully */
  APPROVED = 'approved',
  /** A step was rejected and the workflow terminated */
  REJECTED = 'rejected',
  /** Initiator or admin cancelled the workflow */
  CANCELLED = 'cancelled',
  /** Workflow completed (non-approval flows) */
  COMPLETED = 'completed',
  /** A step was returned; awaiting resubmission */
  RETURNED = 'returned',
  /** Workflow expired due to SLA */
  EXPIRED = 'expired',
  /** System error during execution */
  FAILED = 'failed',
}

// ─── Workflow Step Instance Status ───
export enum WorkflowStepInstanceStatus {
  /** Step not yet reached */
  PENDING = 'pending',
  /** Step is active and awaiting action */
  ACTIVE = 'active',
  /** Step was approved */
  APPROVED = 'approved',
  /** Step was rejected */
  REJECTED = 'rejected',
  /** Step was returned to a previous step */
  RETURNED = 'returned',
  /** Step was skipped (condition or auto-skip) */
  SKIPPED = 'skipped',
  /** Step was cancelled (parent workflow cancelled) */
  CANCELLED = 'cancelled',
  /** Step expired due to SLA */
  EXPIRED = 'expired',
  /** Step completed (non-approval task steps) */
  COMPLETED = 'completed',
}

// ─── Step Type ───
export enum WorkflowStepType {
  /** Requires one or more approvals */
  APPROVAL = 'approval',
  /** Requires task completion (e.g., upload document, fill form) */
  TASK = 'task',
  /** Sends a notification only, auto-completes */
  NOTIFICATION = 'notification',
  /** Evaluates conditions and routes, auto-completes */
  CONDITION = 'condition',
  /** System action (API call, status update), auto-completes */
  SYSTEM = 'system',
}

// ─── Approval Strategy ───
export enum ApprovalStrategy {
  /** Any one assignee can approve */
  ANY = 'any',
  /** All assignees must approve */
  ALL = 'all',
  /** Specific count required (configured in step config) */
  THRESHOLD = 'threshold',
}

// ─── Transition Action ───
export enum TransitionAction {
  APPROVE = 'approve',
  REJECT = 'reject',
  RETURN = 'return',
  COMPLETE = 'complete',
  SKIP = 'skip',
  AUTO = 'auto',
}

// ─── Trigger Mode ───
export enum WorkflowTriggerMode {
  /** Started manually by a user */
  MANUAL = 'manual',
  /** Started automatically by a module/business action */
  AUTOMATIC = 'automatic',
  /** Started via API call */
  API = 'api',
  /** Started by a system event */
  EVENT = 'event',
}

// ─── Assignee Resolution Strategy ───
export enum AssigneeStrategy {
  /** Assign to specific user(s) by ID */
  USER = 'user',
  /** Assign to users with a specific role */
  ROLE = 'role',
  /** Assign to members of a permission group */
  PERMISSION_GROUP = 'permission_group',
  /** Assign to subject employee's direct manager */
  MANAGER = 'manager',
  /** Assign to manager at a specific level (e.g., 2nd level) */
  MANAGER_LEVEL = 'manager_level',
  /** Assign to HR admins of the company */
  HR = 'hr',
  /** Assign to company admins */
  COMPANY_ADMIN = 'company_admin',
  /** Assign to org unit manager of the subject */
  ORG_UNIT_MANAGER = 'org_unit_manager',
  /** Assign to the workflow initiator */
  INITIATOR = 'initiator',
  /** Assign to the subject employee/user */
  SUBJECT = 'subject',
  /** Custom resolver (identified by resolver key) */
  CUSTOM = 'custom',
}

// ─── Action Type (for audit log) ───
export enum WorkflowActionType {
  STARTED = 'started',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  RETURNED = 'returned',
  REASSIGNED = 'reassigned',
  ESCALATED = 'escalated',
  SKIPPED = 'skipped',
  AUTO_APPROVED = 'auto_approved',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  COMMENT_ADDED = 'comment_added',
  STEP_ACTIVATED = 'step_activated',
}

// ─── Condition Operator ───
export enum ConditionOperator {
  EQUALS = 'eq',
  NOT_EQUALS = 'neq',
  GREATER_THAN = 'gt',
  GREATER_THAN_OR_EQUAL = 'gte',
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUAL = 'lte',
  IN = 'in',
  NOT_IN = 'not_in',
  CONTAINS = 'contains',
  STARTS_WITH = 'starts_with',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null',
  IS_TRUE = 'is_true',
  IS_FALSE = 'is_false',
}

// ─── Condition Logic ───
export enum ConditionLogic {
  AND = 'and',
  OR = 'or',
}
