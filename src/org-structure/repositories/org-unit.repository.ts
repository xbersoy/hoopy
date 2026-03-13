import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Like, IsNull, Repository, EntityManager } from 'typeorm';
import { OrgUnit } from '../entities/org-unit.entity';

export interface OrgUnitRepository {
  create(data: Partial<OrgUnit>): OrgUnit;
  save(entity: OrgUnit, manager?: EntityManager): Promise<OrgUnit>;
  findOne(id: string, companyId: string): Promise<OrgUnit | null>;
  findChildren(companyId: string, parentId: string | null): Promise<OrgUnit[]>;
  findAllByCompany(companyId: string): Promise<OrgUnit[]>;
  findByPathPrefix(companyId: string, pathPrefix: string): Promise<OrgUnit[]>;
  findByIds(ids: string[]): Promise<OrgUnit[]>;
  updateDescendantPaths(
    companyId: string,
    oldPath: string,
    newPath: string,
    depthDelta: number,
    manager: EntityManager,
  ): Promise<void>;
  remove(entity: OrgUnit): Promise<OrgUnit>;
}

@Injectable()
export class TypeOrmOrgUnitRepository implements OrgUnitRepository {
  private readonly repo: Repository<OrgUnit>;

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    this.repo = this.dataSource.getRepository(OrgUnit);
  }

  create(data: Partial<OrgUnit>): OrgUnit {
    return this.repo.create(data);
  }

  save(entity: OrgUnit, manager?: EntityManager): Promise<OrgUnit> {
    const repo = manager ? manager.getRepository(OrgUnit) : this.repo;
    return repo.save(entity);
  }

  findOne(id: string, companyId: string): Promise<OrgUnit | null> {
    return this.repo.findOne({
      where: { id, companyId },
      relations: ['type'],
    });
  }

  findChildren(companyId: string, parentId: string | null): Promise<OrgUnit[]> {
    return this.repo.find({
      where: {
        companyId,
        parentId: parentId ?? IsNull(),
      },
      relations: ['type'],
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  findAllByCompany(companyId: string): Promise<OrgUnit[]> {
    return this.repo.find({
      where: { companyId },
      relations: ['type'],
      order: { depth: 'ASC', sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  findByPathPrefix(companyId: string, pathPrefix: string): Promise<OrgUnit[]> {
    return this.repo.find({
      where: {
        companyId,
        path: Like(`${pathPrefix}%`),
      },
      relations: ['type'],
      order: { depth: 'ASC', sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  findByIds(ids: string[]): Promise<OrgUnit[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.repo
      .createQueryBuilder('ou')
      .leftJoinAndSelect('ou.type', 'type')
      .whereInIds(ids)
      .orderBy('ou.depth', 'ASC')
      .getMany();
  }

  async updateDescendantPaths(
    companyId: string,
    oldPath: string,
    newPath: string,
    depthDelta: number,
    manager: EntityManager,
  ): Promise<void> {
    await manager
      .createQueryBuilder()
      .update(OrgUnit)
      .set({
        path: () => `REPLACE(path, '${oldPath}', '${newPath}')`,
        depth: () => `depth + ${depthDelta}`,
      })
      .where('company_id = :companyId', { companyId })
      .andWhere('path LIKE :prefix', { prefix: `${oldPath}%` })
      .execute();
  }

  remove(entity: OrgUnit): Promise<OrgUnit> {
    return this.repo.remove(entity);
  }
}
