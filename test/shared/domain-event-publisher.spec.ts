import { DomainEventPublisher } from '@/shared/events/domain-event-publisher';
import { DomainEvent } from '@/shared/events/domain-event.interface';

describe('DomainEventPublisher', () => {
  let publisher: DomainEventPublisher;

  beforeEach(() => {
    publisher = new DomainEventPublisher();
  });

  afterEach(() => {
    publisher.removeAllListeners();
  });

  // ─── publish ───

  it('publish emits on specific event type channel', () => {
    const handler = jest.fn();
    publisher.on('order.created', handler);

    const event: DomainEvent = {
      eventType: 'order.created',
      actorType: 'user',
      actorUserId: 'u-1',
      timestamp: new Date(),
    };
    publisher.publish(event);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it('publish emits on wildcard * channel', () => {
    const handler = jest.fn();
    publisher.onAll(handler);

    const event: DomainEvent = {
      eventType: 'order.created',
      actorType: 'system',
      actorService: 'order-service',
      timestamp: new Date(),
    };
    publisher.publish(event);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it('publish emits on both specific and wildcard channels', () => {
    const specificHandler = jest.fn();
    const wildcardHandler = jest.fn();
    publisher.on('task.completed', specificHandler);
    publisher.onAll(wildcardHandler);

    const event: DomainEvent = {
      eventType: 'task.completed',
      actorType: 'user',
      timestamp: new Date(),
    };
    publisher.publish(event);

    expect(specificHandler).toHaveBeenCalledTimes(1);
    expect(wildcardHandler).toHaveBeenCalledTimes(1);
  });

  // ─── emit convenience method ───

  it('emit builds correct DomainEvent structure', () => {
    const handler = jest.fn();
    publisher.on('workflow.started', handler);

    publisher.emit({
      eventType: 'workflow.started',
      actor: { type: 'user', userId: 'u-1' },
      resourceType: 'leave_request',
      resourceId: 'res-1',
      context: { foo: 'bar' },
    });

    expect(handler).toHaveBeenCalledTimes(1);
    const emittedEvent: DomainEvent = handler.mock.calls[0][0];
    expect(emittedEvent.eventType).toBe('workflow.started');
    expect(emittedEvent.actorType).toBe('user');
    expect(emittedEvent.actorUserId).toBe('u-1');
    expect(emittedEvent.resourceType).toBe('leave_request');
    expect(emittedEvent.resourceId).toBe('res-1');
    expect(emittedEvent.context).toEqual({ foo: 'bar' });
    expect(emittedEvent.timestamp).toBeInstanceOf(Date);
    expect(emittedEvent.correlationId).toBeDefined();
  });

  it('emit uses provided correlationId', () => {
    const handler = jest.fn();
    publisher.on('test.event', handler);

    publisher.emit({
      eventType: 'test.event',
      actor: { type: 'system', service: 'test' },
      correlationId: 'corr-123',
    });

    const emittedEvent: DomainEvent = handler.mock.calls[0][0];
    expect(emittedEvent.correlationId).toBe('corr-123');
  });

  it('emitted events have actorType and eventType', () => {
    const handler = jest.fn();
    publisher.onAll(handler);

    publisher.emit({
      eventType: 'sm.transition',
      actor: { type: 'system', service: 'state-machine' },
    });

    const event: DomainEvent = handler.mock.calls[0][0];
    expect(event.actorType).toBe('system');
    expect(event.actorService).toBe('state-machine');
    expect(event.eventType).toBe('sm.transition');
  });

  // ─── on / off ───

  it('off unsubscribes a handler', () => {
    const handler = jest.fn();
    publisher.on('evt', handler);
    publisher.off('evt', handler);

    publisher.publish({
      eventType: 'evt',
      actorType: 'system',
      timestamp: new Date(),
    });

    expect(handler).not.toHaveBeenCalled();
  });

  // ─── onAll ───

  it('onAll receives events of any type', () => {
    const handler = jest.fn();
    publisher.onAll(handler);

    publisher.publish({
      eventType: 'a',
      actorType: 'system',
      timestamp: new Date(),
    });
    publisher.publish({
      eventType: 'b',
      actorType: 'user',
      timestamp: new Date(),
    });

    expect(handler).toHaveBeenCalledTimes(2);
  });

  // ─── removeAllListeners ───

  it('removeAllListeners clears all handlers', () => {
    const h1 = jest.fn();
    const h2 = jest.fn();
    publisher.on('x', h1);
    publisher.onAll(h2);

    publisher.removeAllListeners();

    publisher.publish({
      eventType: 'x',
      actorType: 'system',
      timestamp: new Date(),
    });
    expect(h1).not.toHaveBeenCalled();
    expect(h2).not.toHaveBeenCalled();
  });

  // ─── Multiple listeners on same event ───

  it('multiple listeners on same event type all receive the event', () => {
    const h1 = jest.fn();
    const h2 = jest.fn();
    const h3 = jest.fn();
    publisher.on('shared.event', h1);
    publisher.on('shared.event', h2);
    publisher.on('shared.event', h3);

    const event: DomainEvent = {
      eventType: 'shared.event',
      actorType: 'user',
      timestamp: new Date(),
    };
    publisher.publish(event);

    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
    expect(h3).toHaveBeenCalledTimes(1);
  });
});
