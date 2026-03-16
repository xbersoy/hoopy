import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Permission } from '../entities/permission.entity';

const INSTANCE_ACTIONS = ['create', 'read', 'update', 'delete'];
const FIELD_ACTIONS = ['read', 'edit'];

@Injectable()
export class CustomObjectPermissionsService {
  private readonly logger = new Logger(CustomObjectPermissionsService.name);

  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
  ) {}

  /**
   * Build the resource type prefix for a custom object definition.
   * e.g. "co:ASSET_MGMT"
   */
  private definitionResourceType(definitionCode: string): string {
    return `co:${definitionCode}`;
  }

  /**
   * Build the resource type for a custom object field.
   * e.g. "co:ASSET_MGMT:SERIAL_NUMBER"
   */
  private fieldResourceType(definitionCode: string, fieldCode: string): string {
    return `co:${definitionCode}:${fieldCode}`;
  }

  /**
   * Sync permissions for a custom object definition and its fields.
   * Called when a definition is created or updated.
   */
  async syncPermissionsForDefinition(
    definitionCode: string,
    definitionLabel: string,
    fields: Array<{ code: string; label: string }>,
  ): Promise<void> {
    const defResourceType = this.definitionResourceType(definitionCode);

    // 1. Ensure instance-level permissions exist (create/read/update/delete)
    for (const action of INSTANCE_ACTIONS) {
      const existing = await this.permissionRepo.findOne({
        where: { action, resourceType: defResourceType },
      });
      if (!existing) {
        await this.permissionRepo.save(
          this.permissionRepo.create({
            action,
            resourceType: defResourceType,
            description: `${action} ${definitionLabel} records`,
          }),
        );
        this.logger.log(`Created permission: ${action}:${defResourceType}`);
      }
    }

    // 2. Ensure field-level permissions exist (read/edit per field)
    const expectedFieldResourceTypes = new Set<string>();
    for (const field of fields) {
      const fieldResType = this.fieldResourceType(definitionCode, field.code);
      expectedFieldResourceTypes.add(fieldResType);

      for (const action of FIELD_ACTIONS) {
        const existing = await this.permissionRepo.findOne({
          where: { action, resourceType: fieldResType },
        });
        if (!existing) {
          await this.permissionRepo.save(
            this.permissionRepo.create({
              action,
              resourceType: fieldResType,
              description: `${action} ${definitionLabel}.${field.label}`,
            }),
          );
          this.logger.log(`Created permission: ${action}:${fieldResType}`);
        }
      }
    }

    // 3. Remove stale field-level permissions (fields that no longer exist)
    const allFieldPerms = await this.permissionRepo.find({
      where: { resourceType: Like(`co:${definitionCode}:%`) },
    });
    for (const perm of allFieldPerms) {
      if (!expectedFieldResourceTypes.has(perm.resourceType)) {
        await this.permissionRepo.remove(perm);
        this.logger.log(
          `Removed stale permission: ${perm.action}:${perm.resourceType}`,
        );
      }
    }
  }

  /**
   * Remove all permissions for a custom object definition (instance + field level).
   * Called when a definition is deleted.
   */
  async removePermissionsForDefinition(definitionCode: string): Promise<void> {
    const defResourceType = this.definitionResourceType(definitionCode);

    // Remove instance-level permissions
    const instancePerms = await this.permissionRepo.find({
      where: { resourceType: defResourceType },
    });
    if (instancePerms.length) {
      await this.permissionRepo.remove(instancePerms);
    }

    // Remove field-level permissions
    const fieldPerms = await this.permissionRepo.find({
      where: { resourceType: Like(`co:${definitionCode}:%`) },
    });
    if (fieldPerms.length) {
      await this.permissionRepo.remove(fieldPerms);
    }

    this.logger.log(
      `Removed all permissions for definition: ${definitionCode}`,
    );
  }

  /**
   * Get all custom-object permissions (for API response).
   * Returns permissions with resource types prefixed with "co:".
   */
  async findAllCustomObjectPermissions(): Promise<Permission[]> {
    return this.permissionRepo.find({
      where: { resourceType: Like('co:%') },
      order: { resourceType: 'ASC', action: 'ASC' },
    });
  }

  /**
   * Check if a user has a specific permission on a custom object field via roles.
   * Used for field-level enforcement.
   */
  async hasFieldPermission(
    permissionIds: string[],
    definitionCode: string,
    fieldCode: string,
    action: 'read' | 'edit',
  ): Promise<boolean> {
    if (permissionIds.length === 0) return false;
    const fieldResType = this.fieldResourceType(definitionCode, fieldCode);
    const perm = await this.permissionRepo.findOne({
      where: { action, resourceType: fieldResType },
    });
    if (!perm) return true; // If no permission record exists, allow by default
    return permissionIds.includes(perm.id);
  }
}
