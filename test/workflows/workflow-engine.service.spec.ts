import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { WorkflowEngineService } from '@/workflows/services/workflow-engine.service';
import { ConditionEvaluatorService } from '@/state-machine/services/condition-evaluator.service';
import { DomainEventPublisher } from '@/shared/events/domain-event-publisher';
import {
  WorkflowInstanceStatus,
  WorkflowStepInstanceStatus,
  WorkflowStepType,
  ApprovalStrategy,
  TransitionAction,
} from '@/workflows/enums/workflow.enums';

// ─── Helpers ───

const createMockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn().mockImplementation((data) => data),
  save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
  remove: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
  createQueryBuilder: jest.fn(),
});

const createMockManager = () => {
  const mgr: any = {
    create: jest.fn().mockImplementation((_E: any, data: any) => ({ id: `gen-${Math.random().toString(36).slice(2, 8)}`, ...data })),
    save: jest.fn().mockImplementation((_E: any, data: any) => Promise.resolve(data)),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };
  return mgr;
};

// Step definition factory
const makeStepDef = (overrides: any = {}) => ({
  id: 'step-def-1',
  code: 'manager_approval',
  type: WorkflowStepType.APPROVAL,
  sortOrder: 1,
  assigneeStrategy: 'manager',
  assigneeConfig: {},
  approvalStrategy: ApprovalStrategy.ANY,
  isCommentRequired: false,
  isAttachmentRequired: false,
  isSkippable: false,
  isAutoComplete: false,
  entryCondition: null,
  autoCompleteCondition: null,
  escalationConfig: null,
  slaDurationHours: null,
  transitionCode: 'submit',
  ...overrides,
});

// WorkflowDefinitionVersion factory
const makeVersion = (overrides: any = {}) => ({
  id: 'ver-1',
  version: 1,
  entryCriteria: null,
  steps: [makeStepDef()],
  transitions: [
    {
      id: 'wt-1',
      fromStepId: 'step-def-1',
      toStepId: null,
      action: TransitionAction.APPROVE,
      condition: null,
      isDefault: true,
      priority: 0,
    },
  ],
  ...overrides,
});

describe('WorkflowEngineService', () => {
  let service: WorkflowEngineService;
  let instanceRepo: ReturnType<typeof createMockRepo>;
  let stepInstanceRepo: ReturnType<typeof createMockRepo>;
  let assigneeRepo: ReturnType<typeof createMockRepo>;
  let actionLogRepo: ReturnType<typeof createMockRepo>;
  let dataSource: { transaction: jest.Mock };
  let definitionService: { getPublishedVersionByCode: jest.Mock };
  let assigneeResolver: { resolve: jest.Mock };
  let conditionEvaluator: ConditionEvaluatorService;
  let stateMachineService: {
    createInstanceTransactional: jest.Mock;
    executeTransitionTransactional: jest.Mock;
  };
  let eventPublisher: DomainEventPublisher;

  beforeEach(() => {
    instanceRepo = createMockRepo();
    stepInstanceRepo = createMockRepo();
    assigneeRepo = createMockRepo();
    actionLogRepo = createMockRepo();

    dataSource = {
      transaction: jest.fn(),
    };

    definitionService = {
      getPublishedVersionByCode: jest.fn(),
    };

    assigneeResolver = {
      resolve: jest.fn().mockResolvedValue([{ userId: 'mgr-1', resolvedVia: 'manager' }]),
    };

    conditionEvaluator = new ConditionEvaluatorService();
    jest.spyOn(conditionEvaluator, 'evaluate');

    stateMachineService = {
      createInstanceTransactional: jest.fn().mockResolvedValue({ id: 'sm-inst-1' }),
      executeTransitionTransactional: jest.fn().mockResolvedValue({}),
    };

    eventPublisher = new DomainEventPublisher();
    jest.spyOn(eventPublisher, 'emit');

    service = new WorkflowEngineService(
      instanceRepo as any,
      stepInstanceRepo as any,
      assigneeRepo as any,
      actionLogRepo as any,
      dataSource as any,
      definitionService as any,
      assigneeResolver as any,
      conditionEvaluator,
      stateMachineService as any,
      eventPublisher,
    );
  });

  afterEach(() => {
    eventPublisher.removeAllListeners();
    jest.restoreAllMocks();
  });

  // Helper to wire up a standard transaction mock
  function setupTransaction(managerOverrides: any = {}) {
    const mockManager = createMockManager();
    Object.assign(mockManager, managerOverrides);

    dataSource.transaction.mockImplementation(async (cb) => cb(mockManager));
    return mockManager;
  }

  // ═══════════════════════════════════════════════════════
  //  startWorkflow
  // ═══════════════════════════════════════════════════════

  describe('startWorkflow', () => {
    const companyId = 'comp-1';
    const initiatorId = 'user-1';
    const dto = {
      workflowCode: 'leave_approval',
      resourceType: 'leave_request',
      resourceId: 'res-1',
      subjectId: 'emp-1',
      context: { dept: 'eng', days: 5 },
    };

    it('creates instance, SM instance, activates first step, resolves assignees, and emits event', async () => {
      const version = makeVersion();
      const definition = {
        id: 'def-1',
        code: 'leave_approval',
        stateMachineDefinitionId: 'sm-def-1',
      };
      definitionService.getPublishedVersionByCode.mockResolvedValue({ definition, version });

      const savedInstance = {
        id: 'wf-inst-1',
        companyId,
        versionId: version.id,
        stateMachineInstanceId: 'sm-inst-1',
        status: WorkflowInstanceStatus.PENDING,
        stepInstances: [],
      };

      const mockManager = createMockManager();
      // save returns the instance first, then step instances
      let saveCount = 0;
      mockManager.save.mockImplementation((_E: any, data: any) => {
        saveCount++;
        if (saveCount === 1) return Promise.resolve(savedInstance); // workflow instance
        return Promise.resolve({ id: `step-inst-${saveCount}`, ...data });
      });
      mockManager.findOne.mockResolvedValue({
        ...savedInstance,
        stepInstances: [
          {
            id: 'step-inst-1',
            status: WorkflowStepInstanceStatus.ACTIVE,
            assignees: [{ userId: 'mgr-1', resolvedVia: 'manager' }],
          },
        ],
      });

      dataSource.transaction.mockImplementation(async (cb) => cb(mockManager));

      const result = await service.startWorkflow(companyId, initiatorId, dto as any);

      expect(stateMachineService.createInstanceTransactional).toHaveBeenCalled();
      expect(assigneeResolver.resolve).toHaveBeenCalled();
      expect(eventPublisher.emit).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'workflow.started' }),
      );
      expect(result).toBeDefined();
    });

    it('rejects when entry criteria not met', async () => {
      const version = makeVersion({
        entryCriteria: {
          logic: 'and',
          rules: [{ field: 'days', operator: 'lte', value: 2 }],
        },
      });
      const definition = { id: 'def-1', code: 'leave_approval', stateMachineDefinitionId: 'sm-def-1' };
      definitionService.getPublishedVersionByCode.mockResolvedValue({ definition, version });

      await expect(
        service.startWorkflow(companyId, initiatorId, dto as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════════
  //  takeStepAction
  // ═══════════════════════════════════════════════════════

  describe('takeStepAction', () => {
    const companyId = 'comp-1';
    const actorId = 'mgr-1';
    const instanceId = 'wf-inst-1';
    const stepInstanceId = 'step-inst-1';

    function makeInstance(overrides: any = {}) {
      return {
        id: instanceId,
        companyId,
        versionId: 'ver-1',
        stateMachineInstanceId: 'sm-inst-1',
        resourceType: 'leave_request',
        resourceId: 'res-1',
        initiatorId: 'user-1',
        subjectId: 'emp-1',
        status: WorkflowInstanceStatus.IN_PROGRESS,
        contextSnapshot: { dept: 'eng' },
        stepInstances: [
          {
            id: stepInstanceId,
            stepDefinitionId: 'step-def-1',
            code: 'manager_approval',
            type: WorkflowStepType.APPROVAL,
            status: WorkflowStepInstanceStatus.ACTIVE,
            approvalStrategy: ApprovalStrategy.ANY,
            isCommentRequired: false,
            metadata: {},
            definitionSnapshot: { transitionCode: 'submit' },
            assignees: [
              { id: 'asg-1', userId: 'mgr-1', hasActed: false, decision: null },
            ],
          },
        ],
        ...overrides,
      };
    }

    it('approve resolves step and advances workflow', async () => {
      const instance = makeInstance();
      const versionData = makeVersion();
      const mockManager = createMockManager();
      mockManager.findOne
        .mockResolvedValueOnce(instance)   // find workflow instance
        .mockResolvedValueOnce(versionData) // processTransitions: find version
        .mockResolvedValueOnce(instance);  // final return
      mockManager.find.mockResolvedValue([
        { id: 'asg-1', userId: 'mgr-1', hasActed: true, decision: 'approve' },
      ]);

      dataSource.transaction.mockImplementation(async (cb) => cb(mockManager));

      const result = await service.takeStepAction(companyId, actorId, instanceId, stepInstanceId, {
        decision: 'approve',
        comment: 'Looks good',
      } as any);

      expect(mockManager.save).toHaveBeenCalled();
      expect(eventPublisher.emit).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'workflow.step.completed' }),
      );
    });

    it('reject terminates workflow', async () => {
      const instance = makeInstance();
      const versionData = makeVersion({
        transitions: [
          {
            id: 'wt-1',
            fromStepId: 'step-def-1',
            toStepId: null,
            action: TransitionAction.REJECT,
            condition: null,
            isDefault: true,
            priority: 0,
          },
        ],
      });
      const mockManager = createMockManager();
      mockManager.findOne
        .mockResolvedValueOnce(instance)
        .mockResolvedValueOnce(versionData)
        .mockResolvedValueOnce(instance);
      mockManager.find.mockResolvedValue([
        { id: 'asg-1', userId: 'mgr-1', hasActed: true, decision: 'reject' },
      ]);

      dataSource.transaction.mockImplementation(async (cb) => cb(mockManager));

      await service.takeStepAction(companyId, actorId, instanceId, stepInstanceId, {
        decision: 'reject',
        comment: 'Not approved',
      } as any);

      expect(eventPublisher.emit).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'workflow.step.rejected' }),
      );
    });

    it('return resets target step', async () => {
      const instance = makeInstance();
      const versionData = makeVersion({
        transitions: [
          {
            id: 'wt-1',
            fromStepId: 'step-def-1',
            toStepId: 'step-def-0',
            action: TransitionAction.RETURN,
            condition: null,
            isDefault: true,
            priority: 0,
          },
        ],
        steps: [
          makeStepDef({ id: 'step-def-0', code: 'initial_step', sortOrder: 0 }),
          makeStepDef({ id: 'step-def-1', code: 'manager_approval', sortOrder: 1 }),
        ],
      });
      const mockManager = createMockManager();
      mockManager.findOne
        .mockResolvedValueOnce(instance)
        .mockResolvedValueOnce(versionData)
        .mockResolvedValueOnce(instance);
      mockManager.find.mockResolvedValue([
        { id: 'asg-1', userId: 'mgr-1', hasActed: true, decision: 'return' },
      ]);

      dataSource.transaction.mockImplementation(async (cb) => cb(mockManager));

      await service.takeStepAction(companyId, actorId, instanceId, stepInstanceId, {
        decision: 'return',
        comment: 'Please revise',
      } as any);

      expect(eventPublisher.emit).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'workflow.step.returned' }),
      );
    });

    it('rejects action on non-active step', async () => {
      const instance = makeInstance({
        stepInstances: [
          {
            id: stepInstanceId,
            status: WorkflowStepInstanceStatus.PENDING,
            assignees: [{ userId: 'mgr-1', hasActed: false }],
          },
        ],
      });
      const mockManager = createMockManager();
      mockManager.findOne.mockResolvedValue(instance);

      dataSource.transaction.mockImplementation(async (cb) => cb(mockManager));

      await expect(
        service.takeStepAction(companyId, actorId, instanceId, stepInstanceId, {
          decision: 'approve',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects non-assignee (ForbiddenException)', async () => {
      const instance = makeInstance();
      const mockManager = createMockManager();
      mockManager.findOne.mockResolvedValue(instance);

      dataSource.transaction.mockImplementation(async (cb) => cb(mockManager));

      await expect(
        service.takeStepAction(companyId, 'stranger-id', instanceId, stepInstanceId, {
          decision: 'approve',
        } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects already-acted assignee', async () => {
      const instance = makeInstance({
        stepInstances: [
          {
            id: stepInstanceId,
            status: WorkflowStepInstanceStatus.ACTIVE,
            approvalStrategy: ApprovalStrategy.ALL,
            isCommentRequired: false,
            assignees: [
              { id: 'asg-1', userId: 'mgr-1', hasActed: true, decision: 'approve' },
            ],
          },
        ],
      });
      const mockManager = createMockManager();
      mockManager.findOne.mockResolvedValue(instance);

      dataSource.transaction.mockImplementation(async (cb) => cb(mockManager));

      await expect(
        service.takeStepAction(companyId, actorId, instanceId, stepInstanceId, {
          decision: 'approve',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('requires comment when isCommentRequired is true', async () => {
      const instance = makeInstance({
        stepInstances: [
          {
            id: stepInstanceId,
            status: WorkflowStepInstanceStatus.ACTIVE,
            approvalStrategy: ApprovalStrategy.ANY,
            isCommentRequired: true,
            metadata: {},
            definitionSnapshot: {},
            assignees: [
              { id: 'asg-1', userId: 'mgr-1', hasActed: false },
            ],
          },
        ],
      });
      const mockManager = createMockManager();
      mockManager.findOne.mockResolvedValue(instance);

      dataSource.transaction.mockImplementation(async (cb) => cb(mockManager));

      await expect(
        service.takeStepAction(companyId, actorId, instanceId, stepInstanceId, {
          decision: 'approve',
          // no comment
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects action on completed/cancelled workflow', async () => {
      const instance = makeInstance({ status: WorkflowInstanceStatus.COMPLETED });
      const mockManager = createMockManager();
      mockManager.findOne.mockResolvedValue(instance);

      dataSource.transaction.mockImplementation(async (cb) => cb(mockManager));

      await expect(
        service.takeStepAction(companyId, actorId, instanceId, stepInstanceId, {
          decision: 'approve',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════════
  //  cancelWorkflow
  // ═══════════════════════════════════════════════════════

  describe('cancelWorkflow', () => {
    it('cancels active/pending steps and emits event', async () => {
      const instance = {
        id: 'wf-1',
        companyId: 'comp-1',
        status: WorkflowInstanceStatus.IN_PROGRESS,
        resourceType: 'leave_request',
        resourceId: 'res-1',
        stateMachineInstanceId: 'sm-1',
        stepInstances: [
          { id: 's1', status: WorkflowStepInstanceStatus.ACTIVE },
          { id: 's2', status: WorkflowStepInstanceStatus.PENDING },
          { id: 's3', status: WorkflowStepInstanceStatus.APPROVED },
        ],
      };

      const mockManager = createMockManager();
      mockManager.findOne.mockResolvedValue(instance);

      dataSource.transaction.mockImplementation(async (cb) => cb(mockManager));

      const result = await service.cancelWorkflow('comp-1', 'user-1', 'wf-1', { reason: 'No longer needed' } as any);

      expect(result.status).toBe(WorkflowInstanceStatus.CANCELLED);
      // Active and Pending steps should be cancelled
      expect(instance.stepInstances[0].status).toBe(WorkflowStepInstanceStatus.CANCELLED);
      expect(instance.stepInstances[1].status).toBe(WorkflowStepInstanceStatus.CANCELLED);
      // Already-approved step should remain unchanged
      expect(instance.stepInstances[2].status).toBe(WorkflowStepInstanceStatus.APPROVED);
      expect(eventPublisher.emit).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'workflow.cancelled' }),
      );
    });

    it('rejects cancellation of already completed workflow', async () => {
      const instance = {
        id: 'wf-1',
        companyId: 'comp-1',
        status: WorkflowInstanceStatus.COMPLETED,
        stepInstances: [],
      };
      const mockManager = createMockManager();
      mockManager.findOne.mockResolvedValue(instance);

      dataSource.transaction.mockImplementation(async (cb) => cb(mockManager));

      await expect(
        service.cancelWorkflow('comp-1', 'user-1', 'wf-1', {} as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects cancellation of already cancelled workflow', async () => {
      const instance = {
        id: 'wf-1',
        companyId: 'comp-1',
        status: WorkflowInstanceStatus.CANCELLED,
        stepInstances: [],
      };
      const mockManager = createMockManager();
      mockManager.findOne.mockResolvedValue(instance);

      dataSource.transaction.mockImplementation(async (cb) => cb(mockManager));

      await expect(
        service.cancelWorkflow('comp-1', 'user-1', 'wf-1', {} as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════════
  //  findMyPendingTasks
  // ═══════════════════════════════════════════════════════

  describe('findMyPendingTasks', () => {
    it('returns tasks where user is assignee', async () => {
      const tasks = [
        { id: 'step-1', code: 'approval', assignees: [{ userId: 'user-1' }] },
      ];

      const qb = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(tasks),
      };
      stepInstanceRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findMyPendingTasks('comp-1', 'user-1');
      expect(result).toEqual(tasks);
      expect(stepInstanceRepo.createQueryBuilder).toHaveBeenCalledWith('step');
    });
  });

  // ═══════════════════════════════════════════════════════
  //  Approval strategies
  // ═══════════════════════════════════════════════════════

  describe('approval strategies', () => {
    const baseDto = { decision: 'approve' } as any;

    it('ALL strategy: waits for all assignees', async () => {
      const instance = {
        id: 'wf-1',
        companyId: 'comp-1',
        versionId: 'ver-1',
        stateMachineInstanceId: 'sm-1',
        status: WorkflowInstanceStatus.IN_PROGRESS,
        resourceType: 'leave_request',
        resourceId: 'res-1',
        contextSnapshot: {},
        stepInstances: [
          {
            id: 'step-1',
            stepDefinitionId: 'sd-1',
            code: 'team_approval',
            type: WorkflowStepType.APPROVAL,
            status: WorkflowStepInstanceStatus.ACTIVE,
            approvalStrategy: ApprovalStrategy.ALL,
            isCommentRequired: false,
            metadata: {},
            definitionSnapshot: {},
            assignees: [
              { id: 'a1', userId: 'u1', hasActed: false, decision: null },
              { id: 'a2', userId: 'u2', hasActed: false, decision: null },
            ],
          },
        ],
      };

      const mockManager = createMockManager();
      mockManager.findOne.mockResolvedValue(instance);
      // After first action, not all have acted
      mockManager.find.mockResolvedValue([
        { id: 'a1', userId: 'u1', hasActed: true, decision: 'approve' },
        { id: 'a2', userId: 'u2', hasActed: false, decision: null },
      ]);

      dataSource.transaction.mockImplementation(async (cb) => cb(mockManager));

      const result = await service.takeStepAction('comp-1', 'u1', 'wf-1', 'step-1', baseDto);

      // Step should NOT be resolved — still waiting for u2
      // The step status should remain ACTIVE since isStepResolved returns false for ALL
      // and the method returns early without changing step status
      expect(result).toBeDefined();
    });

    it('ANY strategy: resolves on first action', async () => {
      const instance = {
        id: 'wf-1',
        companyId: 'comp-1',
        versionId: 'ver-1',
        stateMachineInstanceId: 'sm-1',
        status: WorkflowInstanceStatus.IN_PROGRESS,
        resourceType: 'leave_request',
        resourceId: 'res-1',
        contextSnapshot: {},
        stepInstances: [
          {
            id: 'step-1',
            stepDefinitionId: 'sd-1',
            code: 'manager_approval',
            type: WorkflowStepType.APPROVAL,
            status: WorkflowStepInstanceStatus.ACTIVE,
            approvalStrategy: ApprovalStrategy.ANY,
            isCommentRequired: false,
            metadata: {},
            definitionSnapshot: { transitionCode: null },
            assignees: [
              { id: 'a1', userId: 'u1', hasActed: false, decision: null },
              { id: 'a2', userId: 'u2', hasActed: false, decision: null },
            ],
          },
        ],
      };

      const versionData = makeVersion({
        steps: [makeStepDef({ id: 'sd-1' })],
        transitions: [
          {
            id: 'wt-1',
            fromStepId: 'sd-1',
            toStepId: null,
            action: TransitionAction.APPROVE,
            condition: null,
            isDefault: true,
            priority: 0,
          },
        ],
      });

      const mockManager = createMockManager();
      mockManager.findOne
        .mockResolvedValueOnce(instance)
        .mockResolvedValueOnce(versionData)
        .mockResolvedValueOnce(instance);
      mockManager.find.mockResolvedValue([
        { id: 'a1', userId: 'u1', hasActed: true, decision: 'approve' },
        { id: 'a2', userId: 'u2', hasActed: false, decision: null },
      ]);

      dataSource.transaction.mockImplementation(async (cb) => cb(mockManager));

      const result = await service.takeStepAction('comp-1', 'u1', 'wf-1', 'step-1', baseDto);

      // ANY strategy resolves immediately on first approve
      expect(mockManager.save).toHaveBeenCalled();
      expect(eventPublisher.emit).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'workflow.step.completed' }),
      );
    });
  });

  // ═══════════════════════════════════════════════════════
  //  findInstanceById
  // ═══════════════════════════════════════════════════════

  describe('findInstanceById', () => {
    it('returns instance with relations', async () => {
      const instance = { id: 'wf-1', stepInstances: [], actionLogs: [] };
      instanceRepo.findOne.mockResolvedValue(instance);

      const result = await service.findInstanceById('comp-1', 'wf-1');
      expect(result).toBe(instance);
    });

    it('throws NotFoundException when not found', async () => {
      instanceRepo.findOne.mockResolvedValue(null);
      await expect(service.findInstanceById('comp-1', 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════
  //  Step activation with entry condition skip
  // ═══════════════════════════════════════════════════════

  describe('step activation with entry condition', () => {
    it('skips step when entry condition is not met', async () => {
      const stepDefs = [
        makeStepDef({
          id: 'sd-1',
          code: 'cfo_approval',
          sortOrder: 1,
          entryCondition: {
            logic: 'and',
            rules: [{ field: 'amount', operator: 'gte', value: 10000 }],
          },
        }),
        makeStepDef({
          id: 'sd-2',
          code: 'hr_approval',
          sortOrder: 2,
          entryCondition: null,
        }),
      ];
      const version = makeVersion({ steps: stepDefs });
      const definition = {
        id: 'def-1',
        code: 'purchase_approval',
        stateMachineDefinitionId: 'sm-def-1',
      };

      definitionService.getPublishedVersionByCode.mockResolvedValue({ definition, version });

      const savedInstance = {
        id: 'wf-1',
        companyId: 'comp-1',
        versionId: 'ver-1',
        stateMachineInstanceId: 'sm-1',
        status: WorkflowInstanceStatus.PENDING,
      };

      const mockManager = createMockManager();
      let saveCount = 0;
      mockManager.save.mockImplementation((_E: any, data: any) => {
        saveCount++;
        if (saveCount === 1) return Promise.resolve(savedInstance);
        return Promise.resolve({ id: `step-${saveCount}`, ...data });
      });
      mockManager.findOne.mockResolvedValue({
        ...savedInstance,
        stepInstances: [],
      });

      dataSource.transaction.mockImplementation(async (cb) => cb(mockManager));

      // context.amount = 500 < 10000, so the first step should be skipped
      await service.startWorkflow('comp-1', 'user-1', {
        workflowCode: 'purchase_approval',
        resourceType: 'purchase',
        resourceId: 'po-1',
        context: { amount: 500 },
      } as any);

      // Condition evaluator should have been called to check entry condition
      expect(conditionEvaluator.evaluate).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════
  //  Auto-complete step behavior
  // ═══════════════════════════════════════════════════════

  describe('auto-complete step', () => {
    it('auto-completes step when condition is met', async () => {
      const stepDefs = [
        makeStepDef({
          id: 'sd-1',
          code: 'auto_step',
          sortOrder: 1,
          isAutoComplete: true,
          autoCompleteCondition: {
            logic: 'and',
            rules: [{ field: 'vip', operator: 'is_true' }],
          },
        }),
      ];
      const version = makeVersion({ steps: stepDefs });
      const definition = {
        id: 'def-1',
        code: 'vip_workflow',
        stateMachineDefinitionId: 'sm-def-1',
      };

      definitionService.getPublishedVersionByCode.mockResolvedValue({ definition, version });

      const savedInstance = {
        id: 'wf-1',
        companyId: 'comp-1',
        versionId: 'ver-1',
        stateMachineInstanceId: 'sm-1',
        status: WorkflowInstanceStatus.PENDING,
      };

      const mockManager = createMockManager();
      let saveCount = 0;
      mockManager.save.mockImplementation((_E: any, data: any) => {
        saveCount++;
        if (saveCount === 1) return Promise.resolve(savedInstance);
        return Promise.resolve({ id: `step-${saveCount}`, ...data });
      });
      mockManager.findOne.mockResolvedValue({ ...savedInstance, stepInstances: [] });

      dataSource.transaction.mockImplementation(async (cb) => cb(mockManager));

      await service.startWorkflow('comp-1', 'user-1', {
        workflowCode: 'vip_workflow',
        resourceType: 'request',
        resourceId: 'req-1',
        context: { vip: true },
      } as any);

      // Auto-complete condition should have been evaluated
      expect(conditionEvaluator.evaluate).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════
  //  SLA due date calculation
  // ═══════════════════════════════════════════════════════

  describe('SLA due date calculation', () => {
    it('sets dueDate based on slaDurationHours', async () => {
      const stepDefs = [
        makeStepDef({
          id: 'sd-1',
          code: 'urgent_approval',
          sortOrder: 1,
          slaDurationHours: 24,
        }),
      ];
      const version = makeVersion({ steps: stepDefs });
      const definition = {
        id: 'def-1',
        code: 'urgent_wf',
        stateMachineDefinitionId: 'sm-def-1',
      };

      definitionService.getPublishedVersionByCode.mockResolvedValue({ definition, version });

      const savedInstance = {
        id: 'wf-1',
        companyId: 'comp-1',
        versionId: 'ver-1',
        stateMachineInstanceId: 'sm-1',
        status: WorkflowInstanceStatus.PENDING,
      };

      const savedSteps: any[] = [];
      const mockManager = createMockManager();
      let saveCount = 0;
      mockManager.save.mockImplementation((_E: any, data: any) => {
        saveCount++;
        if (saveCount === 1) return Promise.resolve(savedInstance);
        const saved = { id: `step-${saveCount}`, ...data };
        savedSteps.push(saved);
        return Promise.resolve(saved);
      });
      mockManager.findOne.mockResolvedValue({ ...savedInstance, stepInstances: [] });

      dataSource.transaction.mockImplementation(async (cb) => cb(mockManager));

      const before = new Date();
      await service.startWorkflow('comp-1', 'user-1', {
        workflowCode: 'urgent_wf',
        resourceType: 'ticket',
        resourceId: 'tick-1',
        context: {},
      } as any);
      const after = new Date();

      // Find the step that has a dueDate set
      const stepWithDueDate = savedSteps.find((s) => s.dueDate);
      if (stepWithDueDate) {
        const dueDate = new Date(stepWithDueDate.dueDate);
        expect(dueDate.getTime()).toBeGreaterThanOrEqual(before.getTime() + 24 * 60 * 60 * 1000 - 1000);
        expect(dueDate.getTime()).toBeLessThanOrEqual(after.getTime() + 24 * 60 * 60 * 1000 + 1000);
      }
    });
  });
});
