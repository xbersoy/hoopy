import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionGroupRepository } from '../permissions.repository';
import { PermissionGroup } from '../entities/permission-group.entity';
import {
  PermissionGroupMembership,
  PermissionGroupRole,
} from '../entities/permission-group-membership.entity';
import { PeoplePool } from '../entities/people-pool.entity';
import { PeoplePoolCondition } from '../entities/people-pool-condition.entity';
import {
  CreatePermissionGroupDto,
  UpdatePermissionGroupDto,
} from '../dto/create-permission-group.dto';

@Injectable()
export class PermissionGroupsService {
  constructor(
    @Inject('PERMISSION_GROUP_REPOSITORY')
    private readonly permissionGroupRepository: PermissionGroupRepository,
    @InjectRepository(PermissionGroupMembership)
    private readonly membershipRepo: Repository<PermissionGroupMembership>,
    @InjectRepository(PermissionGroupRole)
    private readonly groupRoleRepo: Repository<PermissionGroupRole>,
    @InjectRepository(PeoplePool)
    private readonly poolRepo: Repository<PeoplePool>,
    @InjectRepository(PeoplePoolCondition)
    private readonly conditionRepo: Repository<PeoplePoolCondition>,
  ) {}

  findAllByCompany(companyId: string): Promise<PermissionGroup[]> {
    return this.permissionGroupRepository.findAllByCompanyId(companyId);
  }

  async findOne(id: string, companyId: string): Promise<PermissionGroup> {
    const group = await this.permissionGroupRepository.findOneByIdAndCompany(
      id,
      companyId,
    );
    if (!group) {
      throw new NotFoundException('Permission group not found');
    }
    return group;
  }

  async create(
    dto: CreatePermissionGroupDto,
    companyId: string,
  ): Promise<PermissionGroup> {
    const group = this.permissionGroupRepository.create({
      name: dto.name,
      description: dto.description,
      companyId,
    });
    const saved = await this.permissionGroupRepository.save(group);

    // Create memberships
    if (dto.memberUserIds?.length) {
      for (const userId of dto.memberUserIds) {
        await this.membershipRepo.save(
          this.membershipRepo.create({
            permissionGroupId: saved.id,
            userId,
          }),
        );
      }
    }

    // Create group roles
    if (dto.permissionRoleIds?.length) {
      for (const roleId of dto.permissionRoleIds) {
        await this.groupRoleRepo.save(
          this.groupRoleRepo.create({
            permissionGroupId: saved.id,
            permissionRoleId: roleId,
          }),
        );
      }
    }

    // Create people pools
    if (dto.peoplePools?.length) {
      for (const poolDto of dto.peoplePools) {
        const pool = await this.poolRepo.save(
          this.poolRepo.create({
            permissionGroupId: saved.id,
            poolType: poolDto.poolType,
          }),
        );
        for (const condDto of poolDto.conditions) {
          await this.conditionRepo.save(
            this.conditionRepo.create({
              peoplePoolId: pool.id,
              field: condDto.field,
              values: condDto.values,
            }),
          );
        }
      }
    }

    return this.findOne(saved.id, companyId);
  }

  async update(
    id: string,
    dto: UpdatePermissionGroupDto,
    companyId: string,
  ): Promise<PermissionGroup> {
    const group = await this.findOne(id, companyId);

    if (dto.name !== undefined) group.name = dto.name;
    if (dto.description !== undefined) group.description = dto.description;
    await this.permissionGroupRepository.save(group);

    // Replace memberships if provided
    if (dto.memberUserIds !== undefined) {
      await this.membershipRepo.delete({ permissionGroupId: id });
      for (const userId of dto.memberUserIds) {
        await this.membershipRepo.save(
          this.membershipRepo.create({
            permissionGroupId: id,
            userId,
          }),
        );
      }
    }

    // Replace group roles if provided
    if (dto.permissionRoleIds !== undefined) {
      await this.groupRoleRepo.delete({ permissionGroupId: id });
      for (const roleId of dto.permissionRoleIds) {
        await this.groupRoleRepo.save(
          this.groupRoleRepo.create({
            permissionGroupId: id,
            permissionRoleId: roleId,
          }),
        );
      }
    }

    // Replace people pools if provided
    if (dto.peoplePools !== undefined) {
      // Cascade delete handles conditions via entity cascade
      const existingPools = await this.poolRepo.find({
        where: { permissionGroupId: id },
      });
      if (existingPools.length > 0) {
        await this.poolRepo.remove(existingPools);
      }

      for (const poolDto of dto.peoplePools) {
        const pool = await this.poolRepo.save(
          this.poolRepo.create({
            permissionGroupId: id,
            poolType: poolDto.poolType,
          }),
        );
        for (const condDto of poolDto.conditions) {
          await this.conditionRepo.save(
            this.conditionRepo.create({
              peoplePoolId: pool.id,
              field: condDto.field,
              values: condDto.values,
            }),
          );
        }
      }
    }

    return this.findOne(id, companyId);
  }

  async remove(id: string, companyId: string): Promise<void> {
    const group = await this.findOne(id, companyId);
    await this.permissionGroupRepository.remove(group);
  }

  async addMember(
    groupId: string,
    userId: string,
    companyId: string,
  ): Promise<void> {
    await this.findOne(groupId, companyId);
    await this.membershipRepo.save(
      this.membershipRepo.create({
        permissionGroupId: groupId,
        userId,
      }),
    );
  }

  async removeMember(
    groupId: string,
    userId: string,
    companyId: string,
  ): Promise<void> {
    await this.findOne(groupId, companyId);
    await this.membershipRepo.delete({
      permissionGroupId: groupId,
      userId,
    });
  }

  async addRole(
    groupId: string,
    permissionRoleId: string,
    companyId: string,
  ): Promise<void> {
    await this.findOne(groupId, companyId);
    await this.groupRoleRepo.save(
      this.groupRoleRepo.create({
        permissionGroupId: groupId,
        permissionRoleId,
      }),
    );
  }

  async removeRole(
    groupId: string,
    permissionRoleId: string,
    companyId: string,
  ): Promise<void> {
    await this.findOne(groupId, companyId);
    await this.groupRoleRepo.delete({
      permissionGroupId: groupId,
      permissionRoleId,
    });
  }
}
