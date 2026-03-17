import { ActivityCategory, ActorType } from '../constants';

/**
 * Payload sent from server to activity-service internal endpoint.
 * Matches InternalCreateActivityLogDto on the activity-service side.
 */
export interface ActivityLogPayload {
  accountId?: string;
  companyId?: string;
  actorUserId?: string;
  actorType: ActorType;
  actorLabel?: string;
  action: string;
  category: ActivityCategory;
  targetEntityType?: string;
  targetEntityId?: string;
  targetEntityLabel?: string;
  description?: string;
  metadata?: Record<string, any>;
  changes?: Record<string, any>;
  correlationId?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  sourceService: string;
  sourceModule?: string;
  isSensitive?: boolean;
  messageKey?: string;
  occurredAt?: string;
}
