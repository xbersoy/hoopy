import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  WorkflowInstance,
  WorkflowStepInstance,
  WorkflowStepAssignee,
  WorkflowActionLog,
  WorkflowStepDefinition,
  WorkflowTransitionDefinition,
} from '../entities';
import {
  WorkflowInstanceStatus,
  WorkflowStepInstanceStatus,
  WorkflowActionType,
  TransitionAction,
} from '../enums/workflow.enums';
import {
  StartWorkflowDto,
  WorkflowStepActionDto,
  CancelWorkflowDto,
} from '../dto/workflow-instance.dto';
import { WorkflowDefinitionService } from './workflow-definition.service';
import { WorkflowAssigneeResolverService } from './workflow-assignee-resolver.service';
import {
  ConditionEvaluatorService,
  ConditionGroup,
} from '../../state-machine/services/condition-evaluator.service';
import { StateMachineService } from '../../state-machine/services/state-machine.service';
import { AssigneeResolutionContext } from '../resolvers/assignee-resolver.interface';
import { DomainEventPublisher } from '../../shared/events';

@Injectable()
export class WorkflowEngineService {
  constructor(
    @InjectRepository(WorkflowInstance)
    private readonly instanceRepo: Repository<WorkflowInstance>,
    @InjectRepository(WorkflowStepInstance)
    private readonly stepInstanceRepo: Repository<WorkflowStepInstance>,
    @InjectRepository(WorkflowStepAssignee)
    private readonly assigneeRepo: Repository<WorkflowStepAssignee>,
    @InjectRepository(WorkflowActionLog)
    private readonly actionLogRepo: Repository<WorkflowActionLog>,
    private readonly dataSource: DataSource,
    private readonly definitionService: WorkflowDefinitionService,
    private readonly assigneeResolver: WorkflowAssigneeResolverService,
    private readonly conditionEvaluator: ConditionEvaluatorService,
    private readonly stateMachineService: StateMachineService,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  // ─── Start Workflow ───

  async startWorkflow(
    companyId: string,
    initiatorId: string,
    dto: StartWorkflowDto,
  ): Promise<WorkflowInstance> {
    const { definition, version } =
      await this.definitionService.getPublishedVersionByCode(
        companyId,
        dto.workflowCode,
      );

    // Check entry criteria
    const context = dto.context || {};
    if (version.entryCriteria) {
      const matches = this.conditionEvaluator.evaluate(
        version.entryCriteria as ConditionGroup,
        context,
      );
      if (!matches) {
        throw new BadRequestException(
          'Workflow entry criteria not met for the given context',
        );
      }
    }

    return this.dataSource.transaction(async (manager) => {
      // Create the backing state machine instance
      const smInstance =
        await this.stateMachineService.createInstanceTransactional(
          manager,
          companyId,
          definition.stateMachineDefinitionId,
          dto.resourceType,
          dto.resourceId,
          context,
        );

      // Create workflow instance
      const instance = manager.create(WorkflowInstance, {
        companyId,
        versionId: version.id,
        stateMachineInstanceId: smInstance.id,
        resourceType: dto.resourceType,
        resourceId: dto.resourceId,
        initiatorId,
        subjectId: dto.subjectId,
        status: WorkflowInstanceStatus.PENDING,
        contextSnapshot: context,
        definitionSnapshot: {
          definitionId: definition.id,
          code: definition.code,
          versionNumber: version.version,
          stateMachineDefinitionId: definition.stateMachineDefinitionId,
        },
      });
      const savedInstance = await manager.save(WorkflowInstance, instance);

      // Sort steps by sortOrder
      const sortedSteps = [...version.steps].sort(
        (a, b) => a.sortOrder - b.sortOrder,
      );

      // Create step instances for all steps
      const stepInstances: WorkflowStepInstance[] = [];
      for (const stepDef of sortedSteps) {
        const stepInstance = manager.create(WorkflowStepInstance, {
          instanceId: savedInstance.id,
          stepDefinitionId: stepDef.id,
          name: stepDef.code,
          code: stepDef.code,
          type: stepDef.type,
          sortOrder: stepDef.sortOrder,
          approvalStrategy: stepDef.approvalStrategy,
          status: WorkflowStepInstanceStatus.PENDING,
          isCommentRequired: stepDef.isCommentRequired,
          isAttachmentRequired: stepDef.isAttachmentRequired,
          isSkippable: stepDef.isSkippable,
          definitionSnapshot: {
            assigneeStrategy: stepDef.assigneeStrategy,
            assigneeConfig: stepDef.assigneeConfig,
            entryCondition: stepDef.entryCondition,
            autoCompleteCondition: stepDef.autoCompleteCondition,
            isAutoComplete: stepDef.isAutoComplete,
            escalationConfig: stepDef.escalationConfig,
            slaDurationHours: stepDef.slaDurationHours,
            transitionCode: stepDef.transitionCode,
          },
        });
        stepInstances.push(
          await manager.save(WorkflowStepInstance, stepInstance),
        );
      }

      // Log workflow start
      await this.logAction(manager, {
        instanceId: savedInstance.id,
        action: WorkflowActionType.STARTED,
        actorId: initiatorId,
        fromStatus: null,
        toStatus: WorkflowInstanceStatus.PENDING,
        metadata: {
          workflowCode: definition.code,
          resourceType: dto.resourceType,
        },
      });

      // Activate the first eligible step
      await this.activateNextStep(
        manager,
        savedInstance,
        stepInstances,
        sortedSteps,
        context,
        companyId,
        initiatorId,
        dto.subjectId,
        dto.resourceType,
        dto.resourceId,
      );

      this.eventPublisher.emit({
        eventType: 'workflow.started',
        actor: { type: 'user', userId: initiatorId },
        resourceType: dto.resourceType,
        resourceId: dto.resourceId,
        workflowInstanceId: savedInstance.id,
        stateMachineInstanceId: smInstance.id,
        context: { workflowCode: definition.code },
      });

      return manager.findOne(WorkflowInstance, {
        where: { id: savedInstance.id },
        relations: ['stepInstances', 'stepInstances.assignees'],
      });
    });
  }

  // ─── Take Step Action ───

  async takeStepAction(
    companyId: string,
    actorId: string,
    instanceId: string,
    stepInstanceId: string,
    dto: WorkflowStepActionDto,
  ): Promise<WorkflowInstance> {
    return this.dataSource.transaction(async (manager) => {
      const instance = await manager.findOne(WorkflowInstance, {
        where: { id: instanceId, companyId },
        relations: ['stepInstances', 'stepInstances.assignees'],
      });
      if (!instance) throw new NotFoundException('Workflow instance not found');

      if (
        instance.status !== WorkflowInstanceStatus.IN_PROGRESS &&
        instance.status !== WorkflowInstanceStatus.PENDING
      ) {
        throw new BadRequestException(
          `Cannot act on a workflow with status "${instance.status}"`,
        );
      }

      const stepInstance = instance.stepInstances.find(
        (s) => s.id === stepInstanceId,
      );
      if (!stepInstance) throw new NotFoundException('Step instance not found');

      if (stepInstance.status !== WorkflowStepInstanceStatus.ACTIVE) {
        throw new BadRequestException(
          `Step is not active (current status: "${stepInstance.status}")`,
        );
      }

      // Verify the actor is an assignee
      const assignee = stepInstance.assignees.find((a) => a.userId === actorId);
      if (!assignee) {
        throw new ForbiddenException('You are not assigned to this step');
      }
      if (assignee.hasActed) {
        throw new BadRequestException('You have already acted on this step');
      }

      // Validate required fields
      if (stepInstance.isCommentRequired && !dto.comment) {
        throw new BadRequestException('A comment is required for this step');
      }

      // Record the assignee's action
      assignee.hasActed = true;
      assignee.decision = dto.decision;
      assignee.comment = dto.comment;
      assignee.actedAt = new Date();
      await manager.save(WorkflowStepAssignee, assignee);

      // Determine if step is resolved based on approval strategy
      const allAssignees = await manager.find(WorkflowStepAssignee, {
        where: { stepInstanceId: stepInstance.id },
      });

      const stepResolved = this.isStepResolved(
        stepInstance,
        allAssignees,
        dto.decision,
      );

      if (!stepResolved) {
        await this.logAction(manager, {
          instanceId: instance.id,
          stepInstanceId: stepInstance.id,
          action: WorkflowActionType.SUBMITTED,
          actorId,
          fromStatus: stepInstance.status,
          toStatus: stepInstance.status,
          comment: dto.comment,
          metadata: { decision: dto.decision },
        });

        return manager.findOne(WorkflowInstance, {
          where: { id: instance.id },
          relations: ['stepInstances', 'stepInstances.assignees'],
        });
      }

      // Step is resolved — map decision to action type and new status
      const { actionType, stepStatus } = this.mapDecisionToStatus(dto.decision);

      const prevStatus = stepInstance.status;
      stepInstance.status = stepStatus;
      stepInstance.decision = dto.decision;
      stepInstance.comment = dto.comment;
      stepInstance.completedAt = new Date();
      stepInstance.metadata = { ...stepInstance.metadata, ...dto.metadata };
      await manager.save(WorkflowStepInstance, stepInstance);

      await this.logAction(manager, {
        instanceId: instance.id,
        stepInstanceId: stepInstance.id,
        action: actionType,
        actorId,
        fromStatus: prevStatus,
        toStatus: stepStatus,
        comment: dto.comment,
        metadata: { decision: dto.decision },
      });

      // Execute state machine transition if step has a transitionCode
      const transitionCode = (stepInstance.definitionSnapshot as any)
        ?.transitionCode;
      if (transitionCode && instance.stateMachineInstanceId) {
        try {
          await this.stateMachineService.executeTransitionTransactional(
            manager,
            companyId,
            instance.stateMachineInstanceId,
            {
              transitionCode,
              actorId,
              comment: dto.comment,
              context: instance.contextSnapshot,
              metadata: { decision: dto.decision, stepCode: stepInstance.code },
            },
          );
        } catch {
          // Transition may not exist in state machine (e.g., intermediate workflow steps).
          // This is acceptable — not all workflow steps map 1:1 to state machine transitions.
        }
      }

      // Process transitions (workflow-level routing)
      await this.processTransitions(
        manager,
        instance,
        stepInstance,
        dto.decision,
      );

      this.eventPublisher.emit({
        eventType: `workflow.step.${dto.decision === 'approve' ? 'completed' : dto.decision === 'reject' ? 'rejected' : dto.decision === 'return' ? 'returned' : 'completed'}`,
        actor: { type: 'user', userId: actorId },
        resourceType: instance.resourceType,
        resourceId: instance.resourceId,
        workflowInstanceId: instance.id,
        stateMachineInstanceId: instance.stateMachineInstanceId,
        context: { stepCode: stepInstance.code, decision: dto.decision },
      });

      return manager.findOne(WorkflowInstance, {
        where: { id: instance.id },
        relations: ['stepInstances', 'stepInstances.assignees', 'actionLogs'],
      });
    });
  }

  // ─── Cancel Workflow ───

  async cancelWorkflow(
    companyId: string,
    actorId: string,
    instanceId: string,
    dto: CancelWorkflowDto,
  ): Promise<WorkflowInstance> {
    return this.dataSource.transaction(async (manager) => {
      const instance = await manager.findOne(WorkflowInstance, {
        where: { id: instanceId, companyId },
        relations: ['stepInstances'],
      });
      if (!instance) throw new NotFoundException('Workflow instance not found');

      if (
        instance.status === WorkflowInstanceStatus.COMPLETED ||
        instance.status === WorkflowInstanceStatus.CANCELLED
      ) {
        throw new BadRequestException(
          `Cannot cancel a workflow with status "${instance.status}"`,
        );
      }

      const prevStatus = instance.status;
      instance.status = WorkflowInstanceStatus.CANCELLED;
      instance.completedAt = new Date();
      await manager.save(WorkflowInstance, instance);

      // Cancel all active/pending step instances
      for (const step of instance.stepInstances) {
        if (
          step.status === WorkflowStepInstanceStatus.ACTIVE ||
          step.status === WorkflowStepInstanceStatus.PENDING
        ) {
          step.status = WorkflowStepInstanceStatus.CANCELLED;
          step.completedAt = new Date();
          await manager.save(WorkflowStepInstance, step);
        }
      }

      await this.logAction(manager, {
        instanceId: instance.id,
        action: WorkflowActionType.CANCELLED,
        actorId,
        fromStatus: prevStatus,
        toStatus: WorkflowInstanceStatus.CANCELLED,
        comment: dto.reason,
      });

      this.eventPublisher.emit({
        eventType: 'workflow.cancelled',
        actor: { type: 'user', userId: actorId },
        resourceType: instance.resourceType,
        resourceId: instance.resourceId,
        workflowInstanceId: instance.id,
        stateMachineInstanceId: instance.stateMachineInstanceId,
        context: { reason: dto.reason },
      });

      return instance;
    });
  }

  // ─── Query Methods ───

  async findInstancesByCompany(
    companyId: string,
    filters?: {
      status?: WorkflowInstanceStatus;
      resourceType?: string;
      resourceId?: string;
      initiatorId?: string;
    },
  ): Promise<WorkflowInstance[]> {
    const where: any = { companyId };
    if (filters?.status) where.status = filters.status;
    if (filters?.resourceType) where.resourceType = filters.resourceType;
    if (filters?.resourceId) where.resourceId = filters.resourceId;
    if (filters?.initiatorId) where.initiatorId = filters.initiatorId;

    return this.instanceRepo.find({
      where,
      relations: ['stepInstances', 'stepInstances.assignees'],
      order: { createdAt: 'DESC' },
    });
  }

  async findInstanceById(
    companyId: string,
    instanceId: string,
  ): Promise<WorkflowInstance> {
    const instance = await this.instanceRepo.findOne({
      where: { id: instanceId, companyId },
      relations: ['stepInstances', 'stepInstances.assignees', 'actionLogs'],
    });
    if (!instance) throw new NotFoundException('Workflow instance not found');
    return instance;
  }

  async findMyPendingTasks(
    companyId: string,
    userId: string,
  ): Promise<WorkflowStepInstance[]> {
    return this.stepInstanceRepo
      .createQueryBuilder('step')
      .innerJoin('step.instance', 'instance')
      .innerJoin('step.assignees', 'assignee')
      .where('instance.companyId = :companyId', { companyId })
      .andWhere('assignee.userId = :userId', { userId })
      .andWhere('assignee.hasActed = false')
      .andWhere('step.status = :status', {
        status: WorkflowStepInstanceStatus.ACTIVE,
      })
      .leftJoinAndSelect('step.assignees', 'allAssignees')
      .leftJoinAndSelect('step.instance', 'inst')
      .orderBy('step.createdAt', 'ASC')
      .getMany();
  }

  async findInstanceByResource(
    companyId: string,
    resourceType: string,
    resourceId: string,
  ): Promise<WorkflowInstance[]> {
    return this.instanceRepo.find({
      where: { companyId, resourceType, resourceId },
      relations: ['stepInstances', 'stepInstances.assignees', 'actionLogs'],
      order: { createdAt: 'DESC' },
    });
  }

  // ─── Private Helpers ───

  private async activateNextStep(
    manager: any,
    instance: WorkflowInstance,
    stepInstances: WorkflowStepInstance[],
    stepDefinitions: WorkflowStepDefinition[],
    context: Record<string, any>,
    companyId: string,
    initiatorId: string,
    subjectId: string,
    resourceType: string,
    resourceId: string,
  ) {
    // Find the first pending step
    const nextStep = stepInstances.find(
      (s) => s.status === WorkflowStepInstanceStatus.PENDING,
    );

    if (!nextStep) {
      // All steps done - complete the workflow
      instance.status = WorkflowInstanceStatus.APPROVED;
      instance.completedAt = new Date();
      await manager.save(WorkflowInstance, instance);

      await this.logAction(manager, {
        instanceId: instance.id,
        action: WorkflowActionType.COMPLETED,
        fromStatus: WorkflowInstanceStatus.IN_PROGRESS,
        toStatus: WorkflowInstanceStatus.APPROVED,
      });
      return;
    }

    // Find the step definition for this step instance
    const stepDef = stepDefinitions.find(
      (d) => d.id === nextStep.stepDefinitionId,
    );

    // Check entry condition
    if (stepDef?.entryCondition) {
      const conditionMet = this.conditionEvaluator.evaluate(
        stepDef.entryCondition as ConditionGroup,
        context,
      );
      if (!conditionMet) {
        // Skip this step
        nextStep.status = WorkflowStepInstanceStatus.SKIPPED;
        nextStep.completedAt = new Date();
        await manager.save(WorkflowStepInstance, nextStep);

        await this.logAction(manager, {
          instanceId: instance.id,
          stepInstanceId: nextStep.id,
          action: WorkflowActionType.SKIPPED,
          fromStatus: WorkflowStepInstanceStatus.PENDING,
          toStatus: WorkflowStepInstanceStatus.SKIPPED,
          metadata: { reason: 'entry_condition_not_met' },
        });

        // Recurse to find next step
        return this.activateNextStep(
          manager,
          instance,
          stepInstances,
          stepDefinitions,
          context,
          companyId,
          initiatorId,
          subjectId,
          resourceType,
          resourceId,
        );
      }
    }

    // Check auto-complete condition
    if (stepDef?.isAutoComplete && stepDef?.autoCompleteCondition) {
      const autoComplete = this.conditionEvaluator.evaluate(
        stepDef.autoCompleteCondition as ConditionGroup,
        context,
      );
      if (autoComplete) {
        nextStep.status = WorkflowStepInstanceStatus.COMPLETED;
        nextStep.decision = 'auto_approved';
        nextStep.completedAt = new Date();
        await manager.save(WorkflowStepInstance, nextStep);

        await this.logAction(manager, {
          instanceId: instance.id,
          stepInstanceId: nextStep.id,
          action: WorkflowActionType.AUTO_APPROVED,
          fromStatus: WorkflowStepInstanceStatus.PENDING,
          toStatus: WorkflowStepInstanceStatus.COMPLETED,
        });

        return this.activateNextStep(
          manager,
          instance,
          stepInstances,
          stepDefinitions,
          context,
          companyId,
          initiatorId,
          subjectId,
          resourceType,
          resourceId,
        );
      }
    }

    // Activate the step
    nextStep.status = WorkflowStepInstanceStatus.ACTIVE;
    nextStep.activatedAt = new Date();

    // Calculate due date from SLA
    if (stepDef?.slaDurationHours) {
      const dueDate = new Date();
      dueDate.setHours(dueDate.getHours() + stepDef.slaDurationHours);
      nextStep.dueDate = dueDate;
    }

    await manager.save(WorkflowStepInstance, nextStep);

    // Resolve assignees
    if (stepDef) {
      const resolutionContext: AssigneeResolutionContext = {
        companyId,
        initiatorId,
        subjectId,
        resourceType,
        resourceId,
        contextData: context,
      };

      try {
        const resolved = await this.assigneeResolver.resolve(
          stepDef.assigneeStrategy,
          stepDef.assigneeConfig || {},
          resolutionContext,
        );

        for (const r of resolved) {
          const assignee = manager.create(WorkflowStepAssignee, {
            stepInstanceId: nextStep.id,
            userId: r.userId,
            resolvedVia: r.resolvedVia,
          });
          await manager.save(WorkflowStepAssignee, assignee);
        }
      } catch (err) {
        // If no assignees could be resolved, mark the step as failed
        nextStep.status = WorkflowStepInstanceStatus.CANCELLED;
        nextStep.completedAt = new Date();
        nextStep.metadata = { ...nextStep.metadata, error: err.message };
        await manager.save(WorkflowStepInstance, nextStep);

        instance.status = WorkflowInstanceStatus.FAILED;
        instance.completedAt = new Date();
        await manager.save(WorkflowInstance, instance);
        return;
      }
    }

    // Update instance
    instance.status = WorkflowInstanceStatus.IN_PROGRESS;
    instance.currentStepId = nextStep.id;
    await manager.save(WorkflowInstance, instance);

    await this.logAction(manager, {
      instanceId: instance.id,
      stepInstanceId: nextStep.id,
      action: WorkflowActionType.STEP_ACTIVATED,
      fromStatus: WorkflowStepInstanceStatus.PENDING,
      toStatus: WorkflowStepInstanceStatus.ACTIVE,
      metadata: { stepCode: nextStep.code },
    });
  }

  private async processTransitions(
    manager: any,
    instance: WorkflowInstance,
    completedStep: WorkflowStepInstance,
    decision: string,
  ) {
    // Map decision to transition action
    const action = this.mapDecisionToTransitionAction(decision);

    // Find transitions for this step
    const version = await manager.findOne(
      (await import('../entities')).WorkflowDefinitionVersion,
      {
        where: { id: instance.versionId },
        relations: ['transitions', 'steps'],
      },
    );

    if (!version) return;

    const transitions = version.transitions
      .filter(
        (t) =>
          t.fromStepId === completedStep.stepDefinitionId &&
          t.action === action,
      )
      .sort((a, b) => a.priority - b.priority);

    // Find matching transition (first whose condition is met, or default)
    let matchedTransition: WorkflowTransitionDefinition | null = null;
    const context = instance.contextSnapshot || {};

    for (const trans of transitions) {
      if (trans.condition) {
        const met = this.conditionEvaluator.evaluate(
          trans.condition as ConditionGroup,
          context,
        );
        if (met) {
          matchedTransition = trans;
          break;
        }
      } else if (trans.isDefault) {
        matchedTransition = trans;
      } else {
        matchedTransition = trans;
        break;
      }
    }

    // If no explicit transition found, try default
    if (!matchedTransition) {
      matchedTransition = transitions.find((t) => t.isDefault) || null;
    }

    if (!matchedTransition || !matchedTransition.toStepId) {
      // No next step — workflow ends
      const finalStatus = this.mapDecisionToWorkflowStatus(decision);
      instance.status = finalStatus;
      instance.completedAt = new Date();
      instance.currentStepId = null;
      await manager.save(WorkflowInstance, instance);

      await this.logAction(manager, {
        instanceId: instance.id,
        action: WorkflowActionType.COMPLETED,
        fromStatus: WorkflowInstanceStatus.IN_PROGRESS,
        toStatus: finalStatus,
      });
      return;
    }

    // Find and activate the next step instance
    const allStepInstances = await manager.find(WorkflowStepInstance, {
      where: { instanceId: instance.id },
      order: { sortOrder: 'ASC' },
    });

    const nextStepInstance = allStepInstances.find(
      (s) => s.stepDefinitionId === matchedTransition.toStepId,
    );

    if (!nextStepInstance) {
      instance.status = this.mapDecisionToWorkflowStatus(decision);
      instance.completedAt = new Date();
      await manager.save(WorkflowInstance, instance);
      return;
    }

    // If the action is "return", reset the target step
    if (action === TransitionAction.RETURN) {
      nextStepInstance.status = WorkflowStepInstanceStatus.PENDING;
      nextStepInstance.completedAt = null;
      nextStepInstance.decision = null;
      nextStepInstance.comment = null;
      await manager.save(WorkflowStepInstance, nextStepInstance);

      await manager.delete(WorkflowStepAssignee, {
        stepInstanceId: nextStepInstance.id,
      });

      instance.status = WorkflowInstanceStatus.RETURNED;
      await manager.save(WorkflowInstance, instance);

      await this.logAction(manager, {
        instanceId: instance.id,
        stepInstanceId: nextStepInstance.id,
        action: WorkflowActionType.RETURNED,
        fromStatus: WorkflowInstanceStatus.IN_PROGRESS,
        toStatus: WorkflowInstanceStatus.RETURNED,
      });
      return;
    }

    // Activate the next step
    const stepDefs = version.steps;
    await this.activateNextStep(
      manager,
      instance,
      allStepInstances.filter(
        (s) =>
          s.id === nextStepInstance.id ||
          s.status === WorkflowStepInstanceStatus.PENDING,
      ),
      stepDefs,
      instance.contextSnapshot || {},
      instance.companyId,
      instance.initiatorId,
      instance.subjectId,
      instance.resourceType,
      instance.resourceId,
    );
  }

  private isStepResolved(
    step: WorkflowStepInstance,
    assignees: WorkflowStepAssignee[],
    decision: string,
  ): boolean {
    if (decision === 'reject' || decision === 'return') return true;

    switch (step.approvalStrategy) {
      case 'any':
        return true;
      case 'all':
        return assignees.every((a) => a.hasActed);
      case 'threshold': {
        const threshold = (step.definitionSnapshot as any)?.threshold ?? 1;
        const actedCount = assignees.filter((a) => a.hasActed).length;
        return actedCount >= threshold;
      }
      default:
        return true;
    }
  }

  private mapDecisionToStatus(decision: string): {
    actionType: WorkflowActionType;
    stepStatus: WorkflowStepInstanceStatus;
  } {
    switch (decision) {
      case 'approve':
        return {
          actionType: WorkflowActionType.APPROVED,
          stepStatus: WorkflowStepInstanceStatus.APPROVED,
        };
      case 'reject':
        return {
          actionType: WorkflowActionType.REJECTED,
          stepStatus: WorkflowStepInstanceStatus.REJECTED,
        };
      case 'return':
        return {
          actionType: WorkflowActionType.RETURNED,
          stepStatus: WorkflowStepInstanceStatus.RETURNED,
        };
      case 'complete':
        return {
          actionType: WorkflowActionType.COMPLETED,
          stepStatus: WorkflowStepInstanceStatus.COMPLETED,
        };
      case 'skip':
        return {
          actionType: WorkflowActionType.SKIPPED,
          stepStatus: WorkflowStepInstanceStatus.SKIPPED,
        };
      default:
        return {
          actionType: WorkflowActionType.COMPLETED,
          stepStatus: WorkflowStepInstanceStatus.COMPLETED,
        };
    }
  }

  private mapDecisionToTransitionAction(decision: string): TransitionAction {
    switch (decision) {
      case 'approve':
        return TransitionAction.APPROVE;
      case 'reject':
        return TransitionAction.REJECT;
      case 'return':
        return TransitionAction.RETURN;
      case 'complete':
        return TransitionAction.COMPLETE;
      case 'skip':
        return TransitionAction.SKIP;
      default:
        return TransitionAction.COMPLETE;
    }
  }

  private mapDecisionToWorkflowStatus(
    decision: string,
  ): WorkflowInstanceStatus {
    switch (decision) {
      case 'approve':
        return WorkflowInstanceStatus.APPROVED;
      case 'reject':
        return WorkflowInstanceStatus.REJECTED;
      case 'return':
        return WorkflowInstanceStatus.RETURNED;
      default:
        return WorkflowInstanceStatus.COMPLETED;
    }
  }

  private async logAction(
    manager: any,
    data: {
      instanceId: string;
      stepInstanceId?: string;
      action: WorkflowActionType;
      actorId?: string;
      fromStatus?: string;
      toStatus?: string;
      comment?: string;
      metadata?: Record<string, any>;
    },
  ) {
    const log = manager.create(WorkflowActionLog, data);
    return manager.save(WorkflowActionLog, log);
  }
}
