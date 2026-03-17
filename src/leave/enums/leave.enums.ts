// ─── Leave Unit Type ───
export enum LeaveUnitType {
  DAY = 'day',
  HALF_DAY = 'half_day',
  HOUR = 'hour',
}

// ─── Leave Type (system keys for built-in types) ───
export enum SystemLeaveType {
  ANNUAL = 'annual',
  SICK = 'sick',
  UNPAID = 'unpaid',
  MATERNITY = 'maternity',
  PATERNITY = 'paternity',
  BEREAVEMENT = 'bereavement',
}

// ─── Grant Strategy ───
export enum GrantStrategy {
  /** One-time bulk grant */
  ONE_TIME = 'one_time',
  /** Recurring yearly/monthly grant */
  RECURRING = 'recurring',
  /** Accrual-based (e.g. monthly proration) */
  ACCRUAL = 'accrual',
  /** Manual HR adjustment */
  MANUAL = 'manual',
}

// ─── Grant Trigger ───
export enum GrantTrigger {
  EMPLOYMENT_START = 'employment_start',
  CALENDAR_YEAR_START = 'calendar_year_start',
  WORK_ANNIVERSARY = 'work_anniversary',
  PROBATION_END = 'probation_end',
  MANUAL = 'manual',
}

// ─── Relative Anchor ───
export enum RelativeAnchor {
  EMPLOYMENT_START = 'employment_start',
  PROBATION_END = 'probation_end',
  WORK_ANNIVERSARY = 'work_anniversary',
  CONTRACT_START = 'contract_start',
  POLICY_EFFECTIVE_DATE = 'policy_effective_date',
  CALENDAR_YEAR_START = 'calendar_year_start',
}

// ─── Carryover Strategy ───
export enum CarryoverStrategy {
  NONE = 'none',
  FULL = 'full',
  CAPPED = 'capped',
}

// ─── Expiry Strategy ───
export enum ExpiryStrategy {
  NEVER = 'never',
  END_OF_PERIOD = 'end_of_period',
  FIXED_DAYS_AFTER_GRANT = 'fixed_days_after_grant',
}

// ─── Grant Status ───
export enum LeaveGrantStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  FORFEITED = 'forfeited',
  FULLY_USED = 'fully_used',
  CANCELLED = 'cancelled',
}

// ─── Grant Source Type ───
export enum GrantSourceType {
  ENTITLEMENT_RULE = 'entitlement_rule',
  MANUAL_ADJUSTMENT = 'manual_adjustment',
  CARRYOVER = 'carryover',
  SYSTEM = 'system',
}

// ─── Balance Transaction Type ───
export enum BalanceTransactionType {
  GRANT = 'grant',
  ACCRUAL = 'accrual',
  RESERVATION = 'reservation',
  RELEASE = 'release',
  CONSUMPTION = 'consumption',
  ADJUSTMENT = 'adjustment',
  EXPIRY = 'expiry',
  CARRYOVER = 'carryover',
  REVERSAL = 'reversal',
}

// ─── Balance Actor Type ───
export enum BalanceActorType {
  USER = 'user',
  SYSTEM = 'system',
  HR = 'hr',
}

// ─── Leave Request Business Status ───
export enum LeaveRequestStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  WITHDRAWN = 'withdrawn',
}

// ─── Session Type (for half-day) ───
export enum SessionType {
  FULL_DAY = 'full_day',
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
}

// ─── Consumption Strategy ───
export enum ConsumptionStrategy {
  EARLIEST_EXPIRING_FIRST = 'earliest_expiring_first',
  OLDEST_GRANT_FIRST = 'oldest_grant_first',
  NEWEST_GRANT_FIRST = 'newest_grant_first',
}

// ─── Recurring Pattern ───
export enum RecurringPattern {
  YEARLY = 'yearly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
}
