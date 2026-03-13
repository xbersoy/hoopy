import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrgUnitService } from '@org-structure/services/org-unit.service';
import { OrgUnit } from '@org-structure/entities/org-unit.entity';
import { OrgUnitStatus } from '@org-structure/enums/org-unit-status.enum';

describe('OrgUnitService', () => {
  let service: OrgUnitService;
  let orgUnitRepository: jest.Mocked<any>;
  let mockQueryRunner: any;

  beforeEach(async () => {
    mockQueryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        getRepository: jest.fn(),
        createQueryBuilder: jest.fn(),
      },
    };

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    orgUnitRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      findChildren: jest.fn(),
      findByPathPrefix: jest.fn(),
      findByIds: jest.fn(),
      updateDescendantPaths: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrgUnitService,
        {
          provide: 'OrgUnitRepository',
          useValue: orgUnitRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<OrgUnitService>(OrgUnitService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── Create ────────────────────────────────────────────────────

  describe('create', () => {
    it('should create a root node with correct path and depth', async () => {
      const companyId = 'company-1';
      const dto = { name: 'HQ' };
      const nodeId = 'node-root';

      orgUnitRepository.create.mockReturnValue({ id: undefined, companyId });
      orgUnitRepository.save
        .mockResolvedValueOnce({ id: nodeId, companyId, depth: 0, path: '' })
        .mockResolvedValueOnce({
          id: nodeId,
          companyId,
          depth: 0,
          path: `/${nodeId}/`,
        });

      const result = await service.create(companyId, dto);
      expect(result.path).toBe(`/${nodeId}/`);
      expect(result.depth).toBe(0);
      expect(orgUnitRepository.save).toHaveBeenCalledTimes(2);
    });

    it('should create a child node with correct path and depth', async () => {
      const companyId = 'company-1';
      const parentId = 'parent-1';
      const childId = 'child-1';

      const parent = {
        id: parentId,
        companyId,
        path: `/${parentId}/`,
        depth: 0,
      } as OrgUnit;

      orgUnitRepository.findOne.mockResolvedValue(parent);
      orgUnitRepository.create.mockReturnValue({ id: undefined, companyId });
      orgUnitRepository.save
        .mockResolvedValueOnce({ id: childId, companyId, depth: 1, path: '' })
        .mockResolvedValueOnce({
          id: childId,
          companyId,
          depth: 1,
          path: `/${parentId}/${childId}/`,
        });

      const result = await service.create(companyId, {
        name: 'Engineering',
        parentId,
      });

      expect(result.path).toBe(`/${parentId}/${childId}/`);
      expect(result.depth).toBe(1);
    });

    it('should throw NotFoundException if parent does not exist', async () => {
      orgUnitRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create('company-1', {
          name: 'Team',
          parentId: 'non-existent',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── Subtree ───────────────────────────────────────────────────

  describe('getSubtree', () => {
    it('should query with the correct path prefix', async () => {
      const node = {
        id: 'node-1',
        companyId: 'company-1',
        path: '/root/node-1/',
        depth: 1,
      } as OrgUnit;

      orgUnitRepository.findOne.mockResolvedValue(node);
      orgUnitRepository.findByPathPrefix.mockResolvedValue([node]);

      await service.getSubtree('node-1', 'company-1');
      expect(orgUnitRepository.findByPathPrefix).toHaveBeenCalledWith(
        'company-1',
        '/root/node-1/',
      );
    });
  });

  // ── Ancestors ─────────────────────────────────────────────────

  describe('getAncestors', () => {
    it('should parse path segments and return ancestors ordered by depth', async () => {
      const node = {
        id: 'c',
        companyId: 'company-1',
        path: '/a/b/c/',
        depth: 2,
      } as OrgUnit;

      const ancestorA = { id: 'a', depth: 0 } as OrgUnit;
      const ancestorB = { id: 'b', depth: 1 } as OrgUnit;

      orgUnitRepository.findOne.mockResolvedValue(node);
      orgUnitRepository.findByIds.mockResolvedValue([ancestorB, ancestorA]);

      const result = await service.getAncestors('c', 'company-1');
      expect(orgUnitRepository.findByIds).toHaveBeenCalledWith(['a', 'b']);
      expect(result[0].id).toBe('a');
      expect(result[1].id).toBe('b');
    });

    it('should return empty array for root node', async () => {
      const root = {
        id: 'root',
        companyId: 'company-1',
        path: '/root/',
        depth: 0,
      } as OrgUnit;

      orgUnitRepository.findOne.mockResolvedValue(root);

      const result = await service.getAncestors('root', 'company-1');
      expect(result).toEqual([]);
    });
  });

  // ── Move ──────────────────────────────────────────────────────

  describe('move', () => {
    it('should update path and depth for node and descendants', async () => {
      const companyId = 'company-1';
      const node = {
        id: 'node-1',
        companyId,
        parentId: 'old-parent',
        path: '/old-parent/node-1/',
        depth: 1,
      } as OrgUnit;

      const newParent = {
        id: 'new-parent',
        companyId,
        path: '/new-parent/',
        depth: 0,
      } as OrgUnit;

      orgUnitRepository.findOne
        .mockResolvedValueOnce(node) // findOne for the node
        .mockResolvedValueOnce(newParent) // findOne for the new parent
        .mockResolvedValueOnce({
          // final findOne after move
          ...node,
          parentId: 'new-parent',
          path: '/new-parent/node-1/',
          depth: 1,
        });

      orgUnitRepository.save.mockResolvedValue(node);
      orgUnitRepository.updateDescendantPaths.mockResolvedValue(undefined);

      await service.move('node-1', companyId, {
        newParentId: 'new-parent',
      });

      expect(orgUnitRepository.updateDescendantPaths).toHaveBeenCalledWith(
        companyId,
        '/old-parent/node-1/',
        '/new-parent/node-1/',
        0, // depth delta: 1 - 1 = 0
        mockQueryRunner.manager,
      );
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should prevent cycle: moving a node into its own subtree', async () => {
      const companyId = 'company-1';

      const node = {
        id: 'parent',
        companyId,
        path: '/parent/',
        depth: 0,
      } as OrgUnit;

      const descendant = {
        id: 'child',
        companyId,
        path: '/parent/child/',
        depth: 1,
      } as OrgUnit;

      orgUnitRepository.findOne
        .mockResolvedValueOnce(node)
        .mockResolvedValueOnce(descendant);

      await expect(
        service.move('parent', companyId, { newParentId: 'child' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should move a node to root', async () => {
      const companyId = 'company-1';
      const node = {
        id: 'node-1',
        companyId,
        parentId: 'parent-1',
        path: '/parent-1/node-1/',
        depth: 1,
      } as OrgUnit;

      orgUnitRepository.findOne
        .mockResolvedValueOnce(node)
        .mockResolvedValueOnce({
          ...node,
          parentId: null,
          path: '/node-1/',
          depth: 0,
        });

      orgUnitRepository.save.mockResolvedValue(node);
      orgUnitRepository.updateDescendantPaths.mockResolvedValue(undefined);

      await service.move('node-1', companyId, {
        newParentId: null,
      });

      expect(orgUnitRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          parentId: null,
          path: '/node-1/',
          depth: 0,
        }),
        mockQueryRunner.manager,
      );
      expect(orgUnitRepository.updateDescendantPaths).toHaveBeenCalledWith(
        companyId,
        '/parent-1/node-1/',
        '/node-1/',
        -1,
        mockQueryRunner.manager,
      );
    });

    it('should rollback transaction on error', async () => {
      const companyId = 'company-1';
      const node = {
        id: 'node-1',
        companyId,
        parentId: null,
        path: '/node-1/',
        depth: 0,
      } as OrgUnit;

      orgUnitRepository.findOne.mockResolvedValueOnce(node);
      orgUnitRepository.save.mockRejectedValue(new Error('DB error'));

      await expect(
        service.move('node-1', companyId, { newParentId: null }),
      ).rejects.toThrow('DB error');
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  // ── Soft delete ───────────────────────────────────────────────

  describe('remove', () => {
    it('should set status to INACTIVE', async () => {
      const node = {
        id: 'node-1',
        companyId: 'company-1',
        status: OrgUnitStatus.ACTIVE,
      } as OrgUnit;

      orgUnitRepository.findOne.mockResolvedValue(node);
      orgUnitRepository.save.mockResolvedValue({
        ...node,
        status: OrgUnitStatus.INACTIVE,
      });

      const result = await service.remove('node-1', 'company-1');
      expect(result.status).toBe(OrgUnitStatus.INACTIVE);
    });
  });
});
