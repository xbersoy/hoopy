import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import {
  StateMachineDefinition,
  StateMachineDefinitionI18n,
  StateMachineState,
  StateMachineStateI18n,
  StateMachineTransition,
  StateMachineTransitionI18n,
  StateMachineInstance,
  StateMachineTransitionHistory,
} from '../entities';
import { StateMachineDefinitionStatus } from '../enums/state-machine.enums';
import {
  ConditionEvaluatorService,
  ConditionGroup,
} from './condition-evaluator.service';
import { DomainEventPublisher, ActorContext } from '../../shared/events';

// ─── Input types ───

export interface CreateStateMachineDefinitionInput {
  code: string;
  resourceType: string;
  category?: string;
  initialStateCode: string;
  metadata?: Record<string, any>;
  translations: { locale: string; name: string; description?: string }[];
  states: CreateStateMachineStateInput[];
  transitions: CreateStateMachineTransitionInput[];
}

export interface CreateStateMachineStateInput {
  code: string;
  isInitial?: boolean;
  isFinal?: boolean;
  sortOrder?: number;
  color?: string;
  icon?: string;
  metadata?: Record<string, any>;
  translations: { locale: string; name: string; description?: string }[];
}

export interface CreateStateMachineTransitionInput {
  code: string;
  fromStateCode: string;
  toStateCode: string;
  guardCondition?: Record<string, any>;
  priority?: number;
  metadata?: Record<string, any>;
  translations: { locale: string; name: string; description?: string }[];
}

export interface TransitionInstanceInput {
  transitionCode: string;
  actorId?: string;
  comment?: string;
  context?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Core state machine service.
 *
 * Manages definitions (with states + transitions), instances, and transition execution.
 * Reusable across any module: workflow engine, employee lifecycle, document lifecycle, etc.
 */
@Injectable()
export class StateMachineService {
  constructor(
    @InjectRepository(StateMachineDefinition)
    private readonly definitionRepo: Repository<StateMachineDefinition>,
    @InjectRepository(StateMachineState)
    private readonly stateRepo: Repository<StateMachineState>,
    @InjectRepository(StateMachineTransition)
    private readonly transitionRepo: Repository<StateMachineTransition>,
    @InjectRepository(StateMachineInstance)
    private readonly instanceRepo: Repository<StateMachineInstance>,
    @InjectRepository(StateMachineTransitionHistory)
    private readonly historyRepo: Repository<StateMachineTransitionHistory>,
    private readonly dataSource: DataSource,
    private readonly conditionEvaluator: ConditionEvaluatorService,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  // ═══════════════════════════════════════════════════════
  //  Definitions
  // ═══════════════════════════════════════════════════════

  async createDefinition(
    companyId: string,
    input: CreateStateMachineDefinitionInput,
    actor?: ActorContext,
  ): Promise<StateMachineDefinition> {
    return this.dataSource.transaction(async (manager) => {
      const definition = manager.create(StateMachineDefinition, {
        companyId,
        code: input.code,
        resourceType: input.resourceType,
        category: input.category as any,
        initialStateCode: input.initialStateCode,
        metadata: input.metadata,
        status: StateMachineDefinitionStatus.DRAFT,
        version: 1,
      });
      const savedDef = await manager.save(StateMachineDefinition, definition);

      // Save definition translations
      for (const t of input.translations) {
        await manager.save(
          StateMachineDefinitionI18n,
          manager.create(StateMachineDefinitionI18n, {
            companyId,
            definitionId: savedDef.id,
            locale: t.locale,
            name: t.name,
            description: t.description,
          }),
        );
      }

      // Create states
      const stateCodeToId = new Map<string, string>();
      for (const s of input.states) {
        const state = await manager.save(
          StateMachineState,
          manager.create(StateMachineState, {
            definitionId: savedDef.id,
            code: s.code,
            isInitial: s.isInitial ?? false,
            isFinal: s.isFinal ?? false,
            sortOrder: s.sortOrder ?? 0,
            color: s.color,
            icon: s.icon,
            metadata: s.metadata,
          }),
        );
        stateCodeToId.set(s.code, state.id);

        for (const t of s.translations) {
          await manager.save(
            StateMachineStateI18n,
            manager.create(StateMachineStateI18n, {
              companyId,
              stateId: state.id,
              locale: t.locale,
              name: t.name,
              description: t.description,
            }),
          );
        }
      }

      // Create transitions
      for (const tr of input.transitions) {
        const fromStateId = stateCodeToId.get(tr.fromStateCode);
        const toStateId = stateCodeToId.get(tr.toStateCode);
        if (!fromStateId)
          throw new BadRequestException(
            `Unknown from state code: "${tr.fromStateCode}"`,
          );
        if (!toStateId)
          throw new BadRequestException(
            `Unknown to state code: "${tr.toStateCode}"`,
          );

        const transition = await manager.save(
          StateMachineTransition,
          manager.create(StateMachineTransition, {
            definitionId: savedDef.id,
            code: tr.code,
            fromStateId,
            toStateId,
            guardCondition: tr.guardCondition,
            priority: tr.priority ?? 0,
            metadata: tr.metadata,
          }),
        );

        for (const t of tr.translations) {
          await manager.save(
            StateMachineTransitionI18n,
            manager.create(StateMachineTransitionI18n, {
              companyId,
              transitionId: transition.id,
              locale: t.locale,
              name: t.name,
              description: t.description,
            }),
          );
        }
      }

      const result = await this.findDefinitionById(
        companyId,
        savedDef.id,
        manager,
      );
      this.eventPublisher.emit({
        eventType: 'state_machine.definition.created',
        actor: actor ?? { type: 'system', service: 'state-machine' },
        resourceType: input.resourceType,
        context: { definitionId: result.id, code: input.code },
      });
      return result;
    });
  }

  async findDefinitionsByCompany(
    companyId: string,
  ): Promise<StateMachineDefinition[]> {
    return this.definitionRepo.find({
      where: { companyId },
      relations: ['translations'],
      order: { createdAt: 'DESC' },
    });
  }

  async findDefinitionById(
    companyId: string,
    id: string,
    entityManager?: EntityManager,
  ): Promise<StateMachineDefinition> {
    const repo = entityManager
      ? entityManager.getRepository(StateMachineDefinition)
      : this.definitionRepo;
    const def = await repo.findOne({
      where: { id, companyId },
      relations: [
        'translations',
        'states',
        'states.translations',
        'transitions',
        'transitions.translations',
      ],
    });
    if (!def) throw new NotFoundException('State machine definition not found');
    return def;
  }

  async findDefinitionByCode(
    companyId: string,
    code: string,
  ): Promise<StateMachineDefinition> {
    const def = await this.definitionRepo.findOne({
      where: { code, companyId },
      relations: [
        'translations',
        'states',
        'states.translations',
        'transitions',
        'transitions.translations',
      ],
    });
    if (!def)
      throw new NotFoundException(
        `State machine definition "${code}" not found`,
      );
    return def;
  }

  async publishDefinition(
    companyId: string,
    id: string,
    actor?: ActorContext,
  ): Promise<StateMachineDefinition> {
    const def = await this.findDefinitionById(companyId, id);
    if (def.status !== StateMachineDefinitionStatus.DRAFT) {
      throw new BadRequestException('Only draft definitions can be published');
    }
    if (!def.states?.length) {
      throw new BadRequestException(
        'Cannot publish a definition with no states',
      );
    }
    def.status = StateMachineDefinitionStatus.PUBLISHED;
    const result = await this.definitionRepo.save(def);
    this.eventPublisher.emit({
      eventType: 'state_machine.definition.published',
      actor: actor ?? { type: 'system', service: 'state-machine' },
      context: { definitionId: id, code: def.code },
    });
    return result;
  }

  async archiveDefinition(
    companyId: string,
    id: string,
    actor?: ActorContext,
  ): Promise<StateMachineDefinition> {
    const def = await this.findDefinitionById(companyId, id);
    def.status = StateMachineDefinitionStatus.ARCHIVED;
    const result = await this.definitionRepo.save(def);
    this.eventPublisher.emit({
      eventType: 'state_machine.definition.archived',
      actor: actor ?? { type: 'system', service: 'state-machine' },
      context: { definitionId: id, code: def.code },
    });
    return result;
  }

  async deleteDefinition(companyId: string, id: string): Promise<void> {
    const def = await this.findDefinitionById(companyId, id);
    await this.definitionRepo.remove(def);
  }

  // ═══════════════════════════════════════════════════════
  //  Instances
  // ═══════════════════════════════════════════════════════

  async createInstance(
    companyId: string,
    definitionId: string,
    resourceType: string,
    resourceId: string,
    context?: Record<string, any>,
    metadata?: Record<string, any>,
  ): Promise<StateMachineInstance> {
    const definition = await this.findDefinitionById(companyId, definitionId);
    if (
      definition.status !== StateMachineDefinitionStatus.PUBLISHED &&
      definition.status !== StateMachineDefinitionStatus.DRAFT
    ) {
      throw new BadRequestException(
        'State machine definition must be published or draft to create instances',
      );
    }

    const initialState = definition.states.find(
      (s) => s.code === definition.initialStateCode,
    );
    if (!initialState) {
      throw new BadRequestException(
        `Initial state "${definition.initialStateCode}" not found in definition`,
      );
    }

    const instance = this.instanceRepo.create({
      companyId,
      definitionId: definition.id,
      resourceType,
      resourceId,
      currentStateId: initialState.id,
      isCompleted: initialState.isFinal,
      definitionVersion: definition.version,
      context,
      metadata,
    });

    return this.instanceRepo.save(instance);
  }

  /**
   * Create a state machine instance inside an existing transaction.
   * Used by the workflow engine to atomically create both workflow and state machine instances.
   */
  async createInstanceTransactional(
    manager: EntityManager,
    companyId: string,
    definitionId: string,
    resourceType: string,
    resourceId: string,
    context?: Record<string, any>,
    metadata?: Record<string, any>,
  ): Promise<StateMachineInstance> {
    const definition = await manager.findOne(StateMachineDefinition, {
      where: { id: definitionId, companyId },
      relations: ['states'],
    });
    if (!definition)
      throw new NotFoundException('State machine definition not found');

    const initialState = definition.states.find(
      (s) => s.code === definition.initialStateCode,
    );
    if (!initialState) {
      throw new BadRequestException(
        `Initial state "${definition.initialStateCode}" not found`,
      );
    }

    const instance = manager.create(StateMachineInstance, {
      companyId,
      definitionId: definition.id,
      resourceType,
      resourceId,
      currentStateId: initialState.id,
      isCompleted: initialState.isFinal,
      definitionVersion: definition.version,
      context,
      metadata,
    });

    return manager.save(StateMachineInstance, instance);
  }

  async findInstanceById(
    companyId: string,
    id: string,
  ): Promise<StateMachineInstance> {
    const instance = await this.instanceRepo.findOne({
      where: { id, companyId },
      relations: ['definition', 'currentState', 'transitionHistory'],
    });
    if (!instance)
      throw new NotFoundException('State machine instance not found');
    return instance;
  }

  async findInstancesByResource(
    companyId: string,
    resourceType: string,
    resourceId: string,
  ): Promise<StateMachineInstance[]> {
    return this.instanceRepo.find({
      where: { companyId, resourceType, resourceId },
      relations: ['currentState', 'definition'],
      order: { createdAt: 'DESC' },
    });
  }

  // ═══════════════════════════════════════════════════════
  //  Transition execution
  // ═══════════════════════════════════════════════════════

  /**
   * Get all transitions available from the current state of an instance,
   * filtered by guard conditions against the merged context.
   */
  async getAvailableTransitions(
    companyId: string,
    instanceId: string,
    additionalContext?: Record<string, any>,
  ): Promise<StateMachineTransition[]> {
    const instance = await this.findInstanceById(companyId, instanceId);
    if (instance.isCompleted) return [];

    const transitions = await this.transitionRepo.find({
      where: {
        definitionId: instance.definitionId,
        fromStateId: instance.currentStateId,
      },
      relations: ['translations', 'toState'],
      order: { priority: 'ASC' },
    });

    const context = { ...instance.context, ...additionalContext };
    return transitions.filter((t) =>
      this.conditionEvaluator.evaluate(
        t.guardCondition as ConditionGroup,
        context,
      ),
    );
  }

  /**
   * Execute a transition on a state machine instance.
   * Validates guard conditions, moves the instance to the target state,
   * and records history.
   */
  async executeTransition(
    companyId: string,
    instanceId: string,
    input: TransitionInstanceInput,
  ): Promise<StateMachineInstance> {
    return this.dataSource.transaction(async (manager) => {
      return this.executeTransitionTransactional(
        manager,
        companyId,
        instanceId,
        input,
      );
    });
  }

  /**
   * Execute a transition inside an existing transaction.
   * Used by the workflow engine for atomic operations.
   */
  async executeTransitionTransactional(
    manager: EntityManager,
    companyId: string,
    instanceId: string,
    input: TransitionInstanceInput,
  ): Promise<StateMachineInstance> {
    const instance = await manager.findOne(StateMachineInstance, {
      where: { id: instanceId, companyId },
      relations: ['currentState'],
    });
    if (!instance)
      throw new NotFoundException('State machine instance not found');
    if (instance.isCompleted)
      throw new BadRequestException('Instance has already completed');

    // Find the transition
    const transition = await manager.findOne(StateMachineTransition, {
      where: {
        definitionId: instance.definitionId,
        code: input.transitionCode,
        fromStateId: instance.currentStateId,
      },
      relations: ['toState'],
    });
    if (!transition) {
      throw new BadRequestException(
        `Transition "${input.transitionCode}" not available from current state`,
      );
    }

    // Evaluate guard condition
    const mergedContext = { ...instance.context, ...input.context };
    if (transition.guardCondition) {
      const allowed = this.conditionEvaluator.evaluate(
        transition.guardCondition as ConditionGroup,
        mergedContext,
      );
      if (!allowed) {
        throw new BadRequestException('Transition guard condition not met');
      }
    }

    // Record history
    const history = manager.create(StateMachineTransitionHistory, {
      instanceId: instance.id,
      transitionId: transition.id,
      fromStateId: instance.currentStateId,
      toStateId: transition.toStateId,
      actorId: input.actorId,
      comment: input.comment,
      contextSnapshot: mergedContext,
      metadata: input.metadata,
    });
    await manager.save(StateMachineTransitionHistory, history);

    // Move to the new state
    instance.currentStateId = transition.toStateId;
    instance.isCompleted = transition.toState.isFinal;
    if (input.context) {
      instance.context = mergedContext;
    }
    await manager.save(StateMachineInstance, instance);

    // Emit domain event for transition execution
    this.eventPublisher.emit({
      eventType: 'state.transition.executed',
      actor: input.actorId
        ? { type: 'user', userId: input.actorId }
        : { type: 'system', service: 'state-machine' },
      resourceType: instance.resourceType,
      resourceId: instance.resourceId,
      stateMachineInstanceId: instance.id,
      context: {
        transitionCode: input.transitionCode,
        fromStateId: history.fromStateId,
        toStateId: history.toStateId,
        isCompleted: instance.isCompleted,
      },
    });

    return instance;
  }

  /**
   * Find the transition that matches the given code from the instance's current state.
   * Returns null if not found. Does NOT execute it.
   */
  async findTransitionByCode(
    manager: EntityManager,
    definitionId: string,
    fromStateId: string,
    transitionCode: string,
  ): Promise<StateMachineTransition | null> {
    return manager.findOne(StateMachineTransition, {
      where: {
        definitionId,
        code: transitionCode,
        fromStateId,
      },
      relations: ['toState', 'fromState'],
    });
  }

  /**
   * Get the state entity by code within a definition.
   */
  async findStateByCode(
    manager: EntityManager,
    definitionId: string,
    stateCode: string,
  ): Promise<StateMachineState | null> {
    return manager.findOne(StateMachineState, {
      where: { definitionId, code: stateCode },
    });
  }
}
