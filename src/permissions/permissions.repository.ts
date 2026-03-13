import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionRole } from './entities/permission-role.entity';
import { PermissionGroup } from './entities/permission-group.entity';

// ── Interfaces ──────────────────────────────────────────────

export interface PermissionRoleRepository {
  create(data: Partial<PermissionRole>): PermissionRole;
  save(role: PermissionRole): Promise<PermissionRole>;
  findAllByCompanyId(companyId: string): Promise<PermissionRole[]>;
  findOneByIdAndCompany(
    id: string,
    companyId: string,
  ): Promise<PermissionRole | null>;
  remove(role: PermissionRole): Promise<PermissionRole>;
}

export interface PermissionGroupRepository {
  create(data: Partial<PermissionGroup>): PermissionGroup;
  save(group: PermissionGroup): Promise<PermissionGroup>;
  findAllByCompanyId(companyId: string): Promise<PermissionGroup[]>;
  findOneByIdAndCompany(
    id: string,
    companyId: string,
  ): Promise<PermissionGroup | null>;
  remove(group: PermissionGroup): Promise<PermissionGroup>;
}

// ── TypeORM Implementations ─────────────────────────────────

@Injectable()
export class TypeOrmPermissionRoleRepository implements PermissionRoleRepository {
  constructor(
    @InjectRepository(PermissionRole)
    private readonly repo: Repository<PermissionRole>,
  ) {}

  create(data: Partial<PermissionRole>): PermissionRole {
    return this.repo.create(data);
  }

  save(role: PermissionRole): Promise<PermissionRole> {
    return this.repo.save(role);
  }

  findAllByCompanyId(companyId: string): Promise<PermissionRole[]> {
    return this.repo.find({
      where: { companyId },
      relations: ['permissions'],
      order: { name: 'ASC' },
    });
  }

  findOneByIdAndCompany(
    id: string,
    companyId: string,
  ): Promise<PermissionRole | null> {
    return this.repo.findOne({
      where: { id, companyId },
      relations: ['permissions'],
    });
  }

  remove(role: PermissionRole): Promise<PermissionRole> {
    return this.repo.remove(role);
  }
}

@Injectable()
export class TypeOrmPermissionGroupRepository implements PermissionGroupRepository {
  constructor(
    @InjectRepository(PermissionGroup)
    private readonly repo: Repository<PermissionGroup>,
  ) {}

  create(data: Partial<PermissionGroup>): PermissionGroup {
    return this.repo.create(data);
  }

  save(group: PermissionGroup): Promise<PermissionGroup> {
    return this.repo.save(group);
  }

  findAllByCompanyId(companyId: string): Promise<PermissionGroup[]> {
    return this.repo.find({
      where: { companyId },
      relations: [
        'memberships',
        'groupRoles',
        'groupRoles.permissionRole',
        'peoplePools',
        'peoplePools.conditions',
      ],
      order: { name: 'ASC' },
    });
  }

  findOneByIdAndCompany(
    id: string,
    companyId: string,
  ): Promise<PermissionGroup | null> {
    return this.repo.findOne({
      where: { id, companyId },
      relations: [
        'memberships',
        'groupRoles',
        'groupRoles.permissionRole',
        'peoplePools',
        'peoplePools.conditions',
      ],
    });
  }

  remove(group: PermissionGroup): Promise<PermissionGroup> {
    return this.repo.remove(group);
  }
}
