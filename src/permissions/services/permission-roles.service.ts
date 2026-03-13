import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionRoleRepository } from '../permissions.repository';
import { Permission } from '../entities/permission.entity';
import { PermissionRole } from '../entities/permission-role.entity';
import {
  CreatePermissionRoleDto,
  UpdatePermissionRoleDto,
} from '../dto/create-permission-role.dto';

@Injectable()
export class PermissionRolesService {
  constructor(
    @Inject('PERMISSION_ROLE_REPOSITORY')
    private readonly permissionRoleRepository: PermissionRoleRepository,
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
  ) {}

  findAllByCompany(companyId: string): Promise<PermissionRole[]> {
    return this.permissionRoleRepository.findAllByCompanyId(companyId);
  }

  async findOne(id: string, companyId: string): Promise<PermissionRole> {
    const role = await this.permissionRoleRepository.findOneByIdAndCompany(
      id,
      companyId,
    );
    if (!role) {
      throw new NotFoundException('Permission role not found');
    }
    return role;
  }

  async create(
    dto: CreatePermissionRoleDto,
    companyId: string,
  ): Promise<PermissionRole> {
    const permissions = await this.permissionRepo.findByIds(dto.permissionIds);
    const role = this.permissionRoleRepository.create({
      name: dto.name,
      description: dto.description,
      companyId,
      permissions,
    });
    return this.permissionRoleRepository.save(role);
  }

  async update(
    id: string,
    dto: UpdatePermissionRoleDto,
    companyId: string,
  ): Promise<PermissionRole> {
    const role = await this.findOne(id, companyId);

    if (dto.name !== undefined) role.name = dto.name;
    if (dto.description !== undefined) role.description = dto.description;
    if (dto.permissionIds) {
      role.permissions = await this.permissionRepo.findByIds(dto.permissionIds);
    }

    return this.permissionRoleRepository.save(role);
  }

  async remove(id: string, companyId: string): Promise<void> {
    const role = await this.findOne(id, companyId);
    await this.permissionRoleRepository.remove(role);
  }
}
