/**
 * Captures request-level context for activity logging.
 * Extracted from the incoming HTTP request in server.
 */
export interface RequestAuditContext {
  actorUserId: string;
  accountId?: string;
  companyId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  correlationId?: string;
}
