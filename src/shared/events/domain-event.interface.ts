/**
 * Structured domain event interface.
 * Designed so events can later be consumed by an external activity-service.
 * Do NOT store pre-rendered messages — keep data structured for localized UIs.
 */
export interface DomainEvent {
  /** Dot-namespaced event type, e.g. 'workflow.step.completed' */
  eventType: string;

  /** Resource type this event relates to, e.g. 'leave_request' */
  resourceType?: string;

  /** Resource ID */
  resourceId?: string;

  /** Actor information */
  actorType: 'user' | 'system';
  actorUserId?: string;
  actorService?: string;

  /** Timestamps */
  timestamp: Date;

  /** Correlation identifiers for cross-service tracing */
  correlationId?: string;
  requestId?: string;
  workflowInstanceId?: string;
  stateMachineInstanceId?: string;

  /** Structured context metadata — never pre-rendered text */
  context?: Record<string, any>;
}

/**
 * Actor context helper to build actor fields for events.
 */
export interface ActorContext {
  type: 'user' | 'system';
  userId?: string;
  service?: string;
}
