// ─── Feedback Submission Mode ─────────────────────────────────
export enum FeedbackSubmissionMode {
  IDENTIFIED = 'identified',
  ANONYMOUS = 'anonymous',
  CONFIDENTIAL = 'confidential',
}

// ─── Feedback Item Status ─────────────────────────────────────
export enum FeedbackStatus {
  SUBMITTED = 'submitted',
  RECEIVED = 'received',
  UNDER_REVIEW = 'under_review',
  NEEDS_MORE_INFO = 'needs_more_info',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  DISMISSED = 'dismissed',
  ESCALATED = 'escalated',
}

// ─── Feedback Sensitivity Level ───────────────────────────────
export enum FeedbackSensitivity {
  NORMAL = 'normal',
  SENSITIVE = 'sensitive',
  CRITICAL = 'critical',
}

// ─── Feedback Request Status ──────────────────────────────────
export enum FeedbackRequestStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

// ─── Feedback Assignment Status ───────────────────────────────
export enum FeedbackAssignmentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

// ─── Survey Status ────────────────────────────────────────────
export enum SurveyStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  CLOSED = 'closed',
  ARCHIVED = 'archived',
}

// ─── Survey Question Types ────────────────────────────────────
export enum QuestionType {
  SHORT_TEXT = 'short_text',
  LONG_TEXT = 'long_text',
  SINGLE_SELECT = 'single_select',
  MULTI_SELECT = 'multi_select',
  YES_NO = 'yes_no',
  RATING_1_5 = 'rating_1_5',
  RATING_1_10 = 'rating_1_10',
  OPINION_SCALE = 'opinion_scale',
  SECTION_HEADER = 'section_header',
}

// ─── Survey Response Status ───────────────────────────────────
export enum SurveyResponseStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
}

// ─── Survey Recurrence ────────────────────────────────────────
export enum SurveyRecurrence {
  ONCE = 'once',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

// ─── Announcement Status ──────────────────────────────────────
export enum AnnouncementStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

// ─── Announcement Priority ────────────────────────────────────
export enum AnnouncementPriority {
  NORMAL = 'normal',
  IMPORTANT = 'important',
  CRITICAL = 'critical',
}

// ─── Audience Target Type ─────────────────────────────────────
export enum AudienceTargetType {
  ALL_EMPLOYEES = 'all_employees',
  SPECIFIC_EMPLOYEES = 'specific_employees',
  DEPARTMENT = 'department',
  ORG_UNIT = 'org_unit',
  EMPLOYMENT_TYPE = 'employment_type',
  LOCATION = 'location',
}

// ─── System Feedback Categories ───────────────────────────────
export enum SystemFeedbackCategory {
  SUGGESTION = 'suggestion',
  CONCERN = 'concern',
  COMPLAINT = 'complaint',
  RECOGNITION = 'recognition',
  MANAGER_FEEDBACK = 'manager_feedback',
  TEAM_FEEDBACK = 'team_feedback',
  WORKPLACE_ISSUE = 'workplace_issue',
  PAYROLL_BENEFITS = 'payroll_benefits',
  FACILITY_EQUIPMENT = 'facility_equipment',
  POLICY_PROCESS = 'policy_process',
  HARASSMENT = 'harassment',
  ETHICS = 'ethics',
  OTHER = 'other',
}
