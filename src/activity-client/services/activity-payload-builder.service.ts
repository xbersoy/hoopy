import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { ActivityLogPayload } from '../dto';
import { ActivityCategory, ActorType } from '../constants';
import { RequestAuditContext } from '../types';

@Injectable()
export class ActivityPayloadBuilderService {
  private readonly sourceService = 'server';

  /**
   * Extract audit context from an authenticated request.
   */
  extractContext(req: Request): RequestAuditContext {
    const user = req['user'] as any;
    return {
      actorUserId: user?.id,
      accountId: user?.accountId,
      companyId: user?.companyId,
      ipAddress: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
      requestId: req.headers['x-request-id'] as string,
      correlationId: req.headers['x-correlation-id'] as string,
    };
  }

  /**
   * Build a complete activity log payload, merging context with event info.
   */
  build(
    context: RequestAuditContext,
    params: {
      action: string;
      category: ActivityCategory;
      sourceModule?: string;
      targetEntityType?: string;
      targetEntityId?: string;
      targetEntityLabel?: string;
      description?: string;
      metadata?: Record<string, any>;
      changes?: Record<string, any>;
      isSensitive?: boolean;
      messageKey?: string;
      actorType?: ActorType;
      actorLabel?: string;
    },
  ): ActivityLogPayload {
    return {
      accountId: context.accountId,
      companyId: context.companyId,
      actorUserId: context.actorUserId,
      actorType: params.actorType ?? ActorType.USER,
      actorLabel: params.actorLabel,
      action: params.action,
      category: params.category,
      targetEntityType: params.targetEntityType,
      targetEntityId: params.targetEntityId,
      targetEntityLabel: params.targetEntityLabel,
      description: params.description,
      metadata: params.metadata,
      changes: params.changes,
      correlationId: context.correlationId,
      requestId: context.requestId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      sourceService: this.sourceService,
      sourceModule: params.sourceModule,
      isSensitive: params.isSensitive,
      messageKey: params.messageKey,
      occurredAt: new Date().toISOString(),
    };
  }

  /**
   * Build a payload for system-generated actions (no user request context).
   */
  buildSystemAction(params: {
    action: string;
    category: ActivityCategory;
    accountId?: string;
    companyId?: string;
    sourceModule?: string;
    targetEntityType?: string;
    targetEntityId?: string;
    targetEntityLabel?: string;
    description?: string;
    metadata?: Record<string, any>;
    changes?: Record<string, any>;
    messageKey?: string;
  }): ActivityLogPayload {
    return {
      accountId: params.accountId,
      companyId: params.companyId,
      actorType: ActorType.SYSTEM,
      actorLabel: this.sourceService,
      action: params.action,
      category: params.category,
      targetEntityType: params.targetEntityType,
      targetEntityId: params.targetEntityId,
      targetEntityLabel: params.targetEntityLabel,
      description: params.description,
      metadata: params.metadata,
      changes: params.changes,
      sourceService: this.sourceService,
      sourceModule: params.sourceModule,
      messageKey: params.messageKey,
      occurredAt: new Date().toISOString(),
    };
  }
}
