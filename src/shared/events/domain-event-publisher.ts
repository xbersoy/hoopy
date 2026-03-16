import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';
import { DomainEvent, ActorContext } from './domain-event.interface';
import { randomUUID } from 'crypto';

export type DomainEventHandler = (event: DomainEvent) => void | Promise<void>;

/**
 * In-process domain event publisher.
 *
 * Publishes structured domain events through an EventEmitter abstraction.
 * Future transports (Kafka, RabbitMQ, Redis Streams) can replace the
 * underlying emitter without changing callers.
 */
@Injectable()
export class DomainEventPublisher {
  private readonly emitter = new EventEmitter();

  constructor() {
    // Allow many listeners for different event consumers
    this.emitter.setMaxListeners(100);
  }

  /**
   * Publish a domain event. Listeners are invoked asynchronously.
   */
  publish(event: DomainEvent): void {
    // Emit on the specific event type channel
    this.emitter.emit(event.eventType, event);
    // Also emit on a wildcard channel for global consumers
    this.emitter.emit('*', event);
  }

  /**
   * Convenience method to build and publish an event in one call.
   */
  emit(params: {
    eventType: string;
    actor: ActorContext;
    resourceType?: string;
    resourceId?: string;
    correlationId?: string;
    requestId?: string;
    workflowInstanceId?: string;
    stateMachineInstanceId?: string;
    context?: Record<string, any>;
  }): void {
    const event: DomainEvent = {
      eventType: params.eventType,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      actorType: params.actor.type,
      actorUserId: params.actor.userId,
      actorService: params.actor.service,
      timestamp: new Date(),
      correlationId: params.correlationId ?? randomUUID(),
      requestId: params.requestId,
      workflowInstanceId: params.workflowInstanceId,
      stateMachineInstanceId: params.stateMachineInstanceId,
      context: params.context,
    };
    this.publish(event);
  }

  /**
   * Subscribe to a specific event type.
   */
  on(eventType: string, handler: DomainEventHandler): void {
    this.emitter.on(eventType, handler);
  }

  /**
   * Subscribe to all events (wildcard).
   */
  onAll(handler: DomainEventHandler): void {
    this.emitter.on('*', handler);
  }

  /**
   * Remove a listener.
   */
  off(eventType: string, handler: DomainEventHandler): void {
    this.emitter.off(eventType, handler);
  }

  /**
   * Remove all listeners for testing or shutdown.
   */
  removeAllListeners(): void {
    this.emitter.removeAllListeners();
  }
}
