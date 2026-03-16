import { NotFoundException, BadRequestException } from '@nestjs/common';
import { StateMachineService } from '@/state-machine/services/state-machine.service';
import { ConditionEvaluatorService } from '@/state-machine/services/condition-evaluator.service';
import { DomainEventPublisher } from '@/shared/events/domain-event-publisher';
import { StateMachineDefinitionStatus } from '@/state-machine/enums/state-machine.enums';

// ─── Helpers ───

const createMockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn().mockImplementation((data) => ({ id: 'generated-id', ...data })),
  save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
  remove: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
});

const createMockManager = () => ({
  create: jest.fn().mockImplementation((_Entity, data) => ({ id: 'gen-id', ...data })),
  save: jest.fn().mockImplementation((_Entity, data) => Promise.resolve({ id: 'gen-id', ...data })),
  findOne: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
});

describe('StateMachineService', () => {
  let service: StateMachineService;
  let definitionRepo: ReturnType<typeof createMockRepo>;
  let stateRepo: ReturnType<typeof createMockRepo>;
  let transitionRepo: ReturnType<typeof createMockRepo>;
  let instanceRepo: ReturnType<typeof createMockRepo>;
  let historyRepo: ReturnType<typeof createMockRepo>;
  let dataSource: { transaction: jest.Mock };
  let conditionEvaluator: ConditionEvaluatorService;
  let eventPublisher: DomainEventPublisher;

  beforeEach(() => {
    definitionRepo = createMockRepo();
    stateRepo = createMockRepo();
    transitionRepo = createMockRepo();
    instanceRepo = createMockRepo();
    historyRepo = createMockRepo();

    dataSource = {
      transaction: jest.fn().mockImplementation((cb) => cb(createMockManager())),
    };

    conditionEvaluator = new ConditionEvaluatorService();
    eventPublisher = new DomainEventPublisher();
    jest.spyOn(eventPublisher, 'emit');

    service = new StateMachineService(
      definitionRepo as any,
      stateRepo as any,
      transitionRepo as any,
      instanceRepo as any,
      historyRepo as any,
      dataSource as any,
      conditionEvaluator,
      eventPublisher,
    );
  });

  afterEach(() => {
    eventPublisher.removeAllListeners();
    jest.restoreAllMocks();
  });

  // ═══════════════════════════════════════════════════════
  //  createDefinition
  // ═══════════════════════════════════════════════════════

  describe('createDefinition', () => {
    const companyId = 'comp-1';
    const input = {
      code: 'leave_lifecycle',
      resourceType: 'leave_request',
      initialStateCode: 'draft',
      translations: [{ locale: 'en', name: 'Leave Lifecycle' }],
      states: [
        { code: 'draft', isInitial: true, translations: [{ locale: 'en', name: 'Draft' }] },
        { code: 'approved', isFinal: true, translations: [{ locale: 'en', name: 'Approved' }] },
      ],
      transitions: [
        {
          code: 'submit',
          fromStateCode: 'draft',
          toStateCode: 'approved',
          translations: [{ locale: 'en', name: 'Submit' }],
        },
      ],
    };

    it('creates definition with states, transitions, and translations via transaction', async () => {
      const mockManager = createMockManager();
      let stateCount = 0;
      mockManager.save.mockImplementation((_Entity: any, data: any) => {
        if (_Entity.name === 'StateMachineState' || (_Entity.name === undefined && data?.code && !data.fromStateId)) {
          stateCount++;
          return Promise.resolve({ id: `state-${stateCount}`, ...data });
        }
        return Promise.resolve({ id: `gen-${Math.random()}`, ...data });
      });

      dataSource.transaction.mockImplementation((cb) => cb(mockManager));

      // Mock findDefinitionById for the return value
      const savedDef = {
        id: 'def-1',
        code: input.code,
        status: StateMachineDefinitionStatus.DRAFT,
        states: [],
        transitions: [],
        translations: [],
      };
      definitionRepo.findOne.mockResolvedValue(savedDef);

      const result = await service.createDefinition(companyId, input);

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      expect(eventPublisher.emit).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'state_machine.definition.created' }),
      );
      expect(result).toBeDefined();
    });

    it('throws BadRequestException for unknown from state code in transitions', async () => {
      const badInput = {
        ...input,
        transitions: [
          { code: 'submit', fromStateCode: 'nonexistent', toStateCode: 'approved', translations: [] },
        ],
      };

      const mockManager = createMockManager();
      let stateCount = 0;
      mockManager.save.mockImplementation((_Entity: any, data: any) => {
        stateCount++;
        return Promise.resolve({ id: `state-${stateCount}`, ...data });
      });
      dataSource.transaction.mockImplementation((cb) => cb(mockManager));

      await expect(service.createDefinition(companyId, badInput)).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════════
  //  findDefinitionsByCompany
  // ═══════════════════════════════════════════════════════

  describe('findDefinitionsByCompany', () => {
    it('returns list of definitions', async () => {
      const defs = [{ id: 'def-1' }, { id: 'def-2' }];
      definitionRepo.find.mockResolvedValue(defs);

      const result = await service.findDefinitionsByCompany('comp-1');
      expect(result).toEqual(defs);
      expect(definitionRepo.find).toHaveBeenCalledWith(expect.objectContaining({ where: { companyId: 'comp-1' } }));
    });
  });

  // ═══════════════════════════════════════════════════════
  //  findDefinitionById
  // ═══════════════════════════════════════════════════════

  describe('findDefinitionById', () => {
    it('returns definition with relations', async () => {
      const def = { id: 'def-1', states: [], transitions: [] };
      definitionRepo.findOne.mockResolvedValue(def);

      const result = await service.findDefinitionById('comp-1', 'def-1');
      expect(result).toBe(def);
    });

    it('throws NotFoundException when not found', async () => {
      definitionRepo.findOne.mockResolvedValue(null);
      await expect(service.findDefinitionById('comp-1', 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════
  //  publishDefinition
  // ═══════════════════════════════════════════════════════

  describe('publishDefinition', () => {
    it('publishes a draft definition', async () => {
      const def = {
        id: 'def-1',
        code: 'test',
        status: StateMachineDefinitionStatus.DRAFT,
        states: [{ id: 's1', code: 'initial' }],
      };
      definitionRepo.findOne.mockResolvedValue(def);
      definitionRepo.save.mockResolvedValue({ ...def, status: StateMachineDefinitionStatus.PUBLISHED });

      const result = await service.publishDefinition('comp-1', 'def-1');
      expect(result.status).toBe(StateMachineDefinitionStatus.PUBLISHED);
      expect(eventPublisher.emit).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'state_machine.definition.published' }),
      );
    });

    it('rejects non-draft definition', async () => {
      const def = {
        id: 'def-1',
        status: StateMachineDefinitionStatus.PUBLISHED,
        states: [{ id: 's1' }],
      };
      definitionRepo.findOne.mockResolvedValue(def);

      await expect(service.publishDefinition('comp-1', 'def-1')).rejects.toThrow(BadRequestException);
    });

    it('rejects definition with no states', async () => {
      const def = {
        id: 'def-1',
        status: StateMachineDefinitionStatus.DRAFT,
        states: [],
      };
      definitionRepo.findOne.mockResolvedValue(def);

      await expect(service.publishDefinition('comp-1', 'def-1')).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════════
  //  archiveDefinition
  // ═══════════════════════════════════════════════════════

  describe('archiveDefinition', () => {
    it('archives a definition and emits event', async () => {
      const def = { id: 'def-1', code: 'test', status: StateMachineDefinitionStatus.PUBLISHED };
      definitionRepo.findOne.mockResolvedValue(def);
      definitionRepo.save.mockResolvedValue({ ...def, status: StateMachineDefinitionStatus.ARCHIVED });

      const result = await service.archiveDefinition('comp-1', 'def-1');
      expect(result.status).toBe(StateMachineDefinitionStatus.ARCHIVED);
      expect(eventPublisher.emit).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'state_machine.definition.archived' }),
      );
    });
  });

  // ═══════════════════════════════════════════════════════
  //  deleteDefinition
  // ═══════════════════════════════════════════════════════

  describe('deleteDefinition', () => {
    it('removes the definition', async () => {
      const def = { id: 'def-1' };
      definitionRepo.findOne.mockResolvedValue(def);

      await service.deleteDefinition('comp-1', 'def-1');
      expect(definitionRepo.remove).toHaveBeenCalledWith(def);
    });

    it('throws NotFoundException when not found', async () => {
      definitionRepo.findOne.mockResolvedValue(null);
      await expect(service.deleteDefinition('comp-1', 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════
  //  createInstance
  // ═══════════════════════════════════════════════════════

  describe('createInstance', () => {
    it('creates instance with initial state', async () => {
      const def = {
        id: 'def-1',
        status: StateMachineDefinitionStatus.PUBLISHED,
        initialStateCode: 'draft',
        version: 1,
        states: [
          { id: 'state-1', code: 'draft', isInitial: true, isFinal: false },
          { id: 'state-2', code: 'done', isInitial: false, isFinal: true },
        ],
      };
      definitionRepo.findOne.mockResolvedValue(def);
      instanceRepo.create.mockImplementation((data) => data);
      instanceRepo.save.mockImplementation((data) => Promise.resolve({ id: 'inst-1', ...data }));

      const result = await service.createInstance('comp-1', 'def-1', 'leave_request', 'res-1');

      expect(result.currentStateId).toBe('state-1');
      expect(result.isCompleted).toBe(false);
      expect(instanceRepo.save).toHaveBeenCalled();
    });

    it('throws when initial state is not found in definition', async () => {
      const def = {
        id: 'def-1',
        status: StateMachineDefinitionStatus.PUBLISHED,
        initialStateCode: 'missing_state',
        version: 1,
        states: [{ id: 'state-1', code: 'draft' }],
      };
      definitionRepo.findOne.mockResolvedValue(def);

      await expect(
        service.createInstance('comp-1', 'def-1', 'leave_request', 'res-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════════
  //  findInstanceById
  // ═══════════════════════════════════════════════════════

  describe('findInstanceById', () => {
    it('returns instance with relations', async () => {
      const instance = { id: 'inst-1', definition: {}, currentState: {} };
      instanceRepo.findOne.mockResolvedValue(instance);

      const result = await service.findInstanceById('comp-1', 'inst-1');
      expect(result).toBe(instance);
    });

    it('throws NotFoundException when not found', async () => {
      instanceRepo.findOne.mockResolvedValue(null);
      await expect(service.findInstanceById('comp-1', 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════
  //  executeTransition
  // ═══════════════════════════════════════════════════════

  describe('executeTransition', () => {
    it('valid transition succeeds and emits event', async () => {
      const instance = {
        id: 'inst-1',
        companyId: 'comp-1',
        definitionId: 'def-1',
        currentStateId: 'state-draft',
        isCompleted: false,
        resourceType: 'leave_request',
        resourceId: 'res-1',
        context: { dept: 'eng' },
        currentState: { id: 'state-draft', code: 'draft' },
      };
      const transition = {
        id: 'trans-1',
        code: 'submit',
        definitionId: 'def-1',
        fromStateId: 'state-draft',
        toStateId: 'state-approved',
        guardCondition: null,
        toState: { id: 'state-approved', code: 'approved', isFinal: true },
      };

      const mockManager = createMockManager();
      mockManager.findOne
        .mockResolvedValueOnce(instance)   // find instance
        .mockResolvedValueOnce(transition); // find transition
      mockManager.save.mockImplementation((_E: any, data: any) => Promise.resolve(data));

      dataSource.transaction.mockImplementation((cb) => cb(mockManager));

      const result = await service.executeTransition('comp-1', 'inst-1', {
        transitionCode: 'submit',
        actorId: 'user-1',
      });

      expect(result.currentStateId).toBe('state-approved');
      expect(result.isCompleted).toBe(true);
      expect(eventPublisher.emit).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'state.transition.executed' }),
      );
    });

    it('fails when transition not found from current state', async () => {
      const instance = {
        id: 'inst-1',
        companyId: 'comp-1',
        definitionId: 'def-1',
        currentStateId: 'state-approved',
        isCompleted: false,
        context: {},
      };

      const mockManager = createMockManager();
      mockManager.findOne
        .mockResolvedValueOnce(instance)
        .mockResolvedValueOnce(null); // transition not found

      dataSource.transaction.mockImplementation((cb) => cb(mockManager));

      await expect(
        service.executeTransition('comp-1', 'inst-1', { transitionCode: 'submit' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('fails when instance is already completed', async () => {
      const instance = {
        id: 'inst-1',
        companyId: 'comp-1',
        isCompleted: true,
      };

      const mockManager = createMockManager();
      mockManager.findOne.mockResolvedValueOnce(instance);

      dataSource.transaction.mockImplementation((cb) => cb(mockManager));

      await expect(
        service.executeTransition('comp-1', 'inst-1', { transitionCode: 'submit' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('fails when guard condition is not met', async () => {
      const instance = {
        id: 'inst-1',
        companyId: 'comp-1',
        definitionId: 'def-1',
        currentStateId: 'state-draft',
        isCompleted: false,
        context: { role: 'viewer' },
      };
      const transition = {
        id: 'trans-1',
        definitionId: 'def-1',
        code: 'approve',
        fromStateId: 'state-draft',
        toStateId: 'state-approved',
        guardCondition: {
          logic: 'and',
          rules: [{ field: 'role', operator: 'eq', value: 'admin' }],
        },
        toState: { id: 'state-approved', isFinal: true },
      };

      const mockManager = createMockManager();
      mockManager.findOne
        .mockResolvedValueOnce(instance)
        .mockResolvedValueOnce(transition);

      dataSource.transaction.mockImplementation((cb) => cb(mockManager));

      await expect(
        service.executeTransition('comp-1', 'inst-1', { transitionCode: 'approve' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════════
  //  getAvailableTransitions
  // ═══════════════════════════════════════════════════════

  describe('getAvailableTransitions', () => {
    it('filters transitions by guard conditions', async () => {
      const instance = {
        id: 'inst-1',
        companyId: 'comp-1',
        definitionId: 'def-1',
        currentStateId: 'state-draft',
        isCompleted: false,
        context: { level: 3 },
      };
      instanceRepo.findOne.mockResolvedValue(instance);

      const transitions = [
        {
          id: 't-1',
          code: 'escalate',
          guardCondition: { logic: 'and', rules: [{ field: 'level', operator: 'gte', value: 5 }] },
        },
        {
          id: 't-2',
          code: 'submit',
          guardCondition: null,
        },
      ];
      transitionRepo.find.mockResolvedValue(transitions);

      const result = await service.getAvailableTransitions('comp-1', 'inst-1');
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('submit');
    });

    it('returns empty for completed instance', async () => {
      const instance = { id: 'inst-1', companyId: 'comp-1', isCompleted: true };
      instanceRepo.findOne.mockResolvedValue(instance);

      const result = await service.getAvailableTransitions('comp-1', 'inst-1');
      expect(result).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════════
  //  Domain events
  // ═══════════════════════════════════════════════════════

  describe('domain events', () => {
    it('emits event on publish', async () => {
      const def = {
        id: 'def-1',
        code: 'test',
        status: StateMachineDefinitionStatus.DRAFT,
        states: [{ id: 's1' }],
      };
      definitionRepo.findOne.mockResolvedValue(def);
      definitionRepo.save.mockResolvedValue({ ...def, status: StateMachineDefinitionStatus.PUBLISHED });

      await service.publishDefinition('comp-1', 'def-1');

      expect(eventPublisher.emit).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'state_machine.definition.published' }),
      );
    });

    it('emits event on archive', async () => {
      const def = { id: 'def-1', code: 'test', status: StateMachineDefinitionStatus.PUBLISHED };
      definitionRepo.findOne.mockResolvedValue(def);
      definitionRepo.save.mockResolvedValue({ ...def, status: StateMachineDefinitionStatus.ARCHIVED });

      await service.archiveDefinition('comp-1', 'def-1');

      expect(eventPublisher.emit).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'state_machine.definition.archived' }),
      );
    });
  });
});
