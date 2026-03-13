import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OrgUnit } from '../entities/org-unit.entity';
import { OrgUnitStatus } from '../enums/org-unit-status.enum';
import { OrgUnitRepository } from '../repositories/org-unit.repository';
import { CreateOrgUnitDto } from '../dto/create-org-unit.dto';
import { UpdateOrgUnitDto } from '../dto/update-org-unit.dto';
import { MoveOrgUnitDto } from '../dto/move-org-unit.dto';

@Injectable()
export class OrgUnitService {
  constructor(
    @Inject('OrgUnitRepository')
    private readonly orgUnitRepository: OrgUnitRepository,
    private readonly dataSource: DataSource,
  ) {}

  // ── Create ────────────────────────────────────────────────────
  async create(companyId: string, dto: CreateOrgUnitDto): Promise<OrgUnit> {
    let parentDepth = -1;
    let parentPath = '/';

    if (dto.parentId) {
      const parent = await this.orgUnitRepository.findOne(
        dto.parentId,
        companyId,
      );
      if (!parent) {
        throw new NotFoundException(
          `Parent org unit "${dto.parentId}" not found`,
        );
      }
      parentDepth = parent.depth;
      parentPath = parent.path;
    }

    // Create and save to get the generated UUID
    const entity = this.orgUnitRepository.create({
      companyId,
      parentId: dto.parentId ?? null,
      typeId: dto.typeId ?? null,
      name: dto.name,
      code: dto.code ?? null,
      description: dto.description ?? null,
      sortOrder: dto.sortOrder ?? null,
      status: OrgUnitStatus.ACTIVE,
      depth: parentDepth + 1,
      path: '', // temporary, will be set after save
    });

    const saved = await this.orgUnitRepository.save(entity);

    // Compute materialized path using the generated id
    if (dto.parentId) {
      saved.path = `${parentPath}${saved.id}/`;
    } else {
      saved.path = `/${saved.id}/`;
    }

    return this.orgUnitRepository.save(saved);
  }

  // ── Read one ──────────────────────────────────────────────────
  async findOne(id: string, companyId: string): Promise<OrgUnit> {
    const entity = await this.orgUnitRepository.findOne(id, companyId);
    if (!entity) {
      throw new NotFoundException(`Org unit "${id}" not found`);
    }
    return entity;
  }

  // ── List children (roots when parentId is null) ───────────────
  async findChildren(companyId: string, parentId?: string): Promise<OrgUnit[]> {
    return this.orgUnitRepository.findChildren(companyId, parentId ?? null);
  }

  // ── All units (flat, for tree building) ───────────────────────
  async findAll(companyId: string): Promise<OrgUnit[]> {
    return this.orgUnitRepository.findAllByCompany(companyId);
  }

  // ── Subtree ───────────────────────────────────────────────────
  async getSubtree(id: string, companyId: string): Promise<OrgUnit[]> {
    const node = await this.findOne(id, companyId);
    return this.orgUnitRepository.findByPathPrefix(companyId, node.path);
  }

  // ── Ancestors ─────────────────────────────────────────────────
  async getAncestors(id: string, companyId: string): Promise<OrgUnit[]> {
    const node = await this.findOne(id, companyId);

    // Parse ancestor IDs from path:  "/aaa/bbb/ccc/" → ["aaa","bbb","ccc"]
    const segments = node.path.split('/').filter((s) => s.length > 0);

    // Remove self (last segment)
    const ancestorIds = segments.slice(0, -1);
    if (ancestorIds.length === 0) return [];

    const ancestors = await this.orgUnitRepository.findByIds(ancestorIds);
    // Sort by depth ascending (root → direct parent)
    return ancestors.sort((a, b) => a.depth - b.depth);
  }

  // ── Update ────────────────────────────────────────────────────
  async update(
    id: string,
    companyId: string,
    dto: UpdateOrgUnitDto,
  ): Promise<OrgUnit> {
    const entity = await this.findOne(id, companyId);
    Object.assign(entity, dto);
    return this.orgUnitRepository.save(entity);
  }

  // ── Delete (soft: set INACTIVE) ───────────────────────────────
  async remove(id: string, companyId: string): Promise<OrgUnit> {
    const entity = await this.findOne(id, companyId);
    entity.status = OrgUnitStatus.INACTIVE;
    return this.orgUnitRepository.save(entity);
  }

  // ── Move (re-parent) ─────────────────────────────────────────
  async move(
    id: string,
    companyId: string,
    dto: MoveOrgUnitDto,
  ): Promise<OrgUnit> {
    const node = await this.findOne(id, companyId);
    const newParentId = dto.newParentId ?? null;

    let newParent: OrgUnit | null = null;

    if (newParentId) {
      newParent = await this.orgUnitRepository.findOne(newParentId, companyId);
      if (!newParent) {
        throw new NotFoundException(`New parent "${newParentId}" not found`);
      }

      // Cycle prevention: new parent must not be inside this node's subtree
      if (newParent.path.startsWith(node.path)) {
        throw new BadRequestException(
          'Cannot move a node into its own subtree (cycle detected)',
        );
      }
    }

    const oldPath = node.path;
    const oldDepth = node.depth;

    const newDepth = newParent ? newParent.depth + 1 : 0;
    const newPath = newParent ? `${newParent.path}${node.id}/` : `/${node.id}/`;
    const depthDelta = newDepth - oldDepth;

    // Run inside a transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update the node itself
      node.parentId = newParentId;
      node.path = newPath;
      node.depth = newDepth;
      if (dto.newSortOrder !== undefined) {
        node.sortOrder = dto.newSortOrder;
      }
      await this.orgUnitRepository.save(node, queryRunner.manager);

      // Update all descendants' paths and depths in bulk
      await this.orgUnitRepository.updateDescendantPaths(
        companyId,
        oldPath,
        newPath,
        depthDelta,
        queryRunner.manager,
      );

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    return this.findOne(id, companyId);
  }
}
