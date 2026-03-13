import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateCustomObjectRecordDto } from '../dto/create-custom-object-record.dto';
import { UpdateCustomObjectRecordDto } from '../dto/update-custom-object-record.dto';
import { PaginationDto, PaginatedResponse } from '../../shared/dto';
import { CustomObjectRecord } from '../entities/custom-object-record.entity';
import { CustomObjectRecordRepository } from '../custom-objects.repository';
import { CustomObjectDefinitionsService } from './custom-object-definitions.service';
import { CustomFieldType } from '../enums/custom-field-type.enum';
import { AttachmentsService } from '../../attachments/attachments.service';
import { PicklistsService } from '../../picklists/picklists.service';
import { PermissionsService } from '../../permissions/services/permissions.service';
import { CustomObjectDefinition } from '../entities/custom-object-definition.entity';

@Injectable()
export class CustomObjectRecordsService {
  constructor(
    @Inject('CustomObjectRecordRepository')
    private readonly recordRepository: CustomObjectRecordRepository,

    private readonly definitionsService: CustomObjectDefinitionsService,
    private readonly attachmentsService: AttachmentsService,
    private readonly picklistsService: PicklistsService,
    private readonly permissionsService: PermissionsService,
  ) { }

  async create(
    dto: CreateCustomObjectRecordDto,
    companyId: string,
    userId: string,
  ): Promise<CustomObjectRecord> {
    const definition = await this.definitionsService.findOne(dto.definitionId);
    const userPermissions = await this.permissionsService.getUserPermissions(userId, companyId);
    const userPermissionIds = userPermissions.map((p) => p.id);

    await this.enforceEditPermissions(dto.data, definition, userPermissionIds);
    await this.validateData(dto.data, definition.fields, companyId);

    const record = this.recordRepository.create({
      definitionId: dto.definitionId,
      companyId,
      baseObjectId: dto.baseObjectId ?? null,
      ownerId: dto.ownerId ?? null,
      ownerGroupId: dto.ownerGroupId ?? null,
      data: dto.data,
      createdBy: userId,
      updatedBy: userId,
    });

    const saved = await this.recordRepository.save(record);
    return this.findOne(saved.id);
  }

  async findAll(
    definitionId: string,
    companyId: string,
    query: PaginationDto,
    userId: string,
    baseObjectId?: string,
  ): Promise<PaginatedResponse<CustomObjectRecord>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { data, total } =
      await this.recordRepository.findPaginatedByDefinition({
        definitionId,
        companyId,
        baseObjectId,
        page,
        limit,
      });

    const definition = await this.definitionsService.findOne(definitionId);
    const userPermissions = await this.permissionsService.getUserPermissions(userId, companyId);
    const userPermissionIds = userPermissions.map((p) => p.id);

    const filteredData = await Promise.all(
      data.map((record) => this.filterReadFields(record, definition, userPermissionIds)),
    );

    return { data: filteredData, total, page, limit };
  }

  async findOne(id: string, userId?: string): Promise<CustomObjectRecord> {
    const record = await this.recordRepository.findOne(id);
    if (!record) {
      throw new NotFoundException(
        `Custom object record with ID "${id}" not found`,
      );
    }

    if (userId) {
      const definition = await this.definitionsService.findOne(record.definitionId);
      const userPermissions = await this.permissionsService.getUserPermissions(userId, record.companyId);
      const userPermissionIds = userPermissions.map((p) => p.id);
      return this.filterReadFields(record, definition, userPermissionIds);
    }

    return record;
  }

  async update(
    id: string,
    dto: UpdateCustomObjectRecordDto,
    userId: string,
  ): Promise<CustomObjectRecord> {
    const record = await this.findOne(id, userId);
    const definition = await this.definitionsService.findOne(
      record.definitionId,
    );
    const userPermissions = await this.permissionsService.getUserPermissions(userId, record.companyId);
    const userPermissionIds = userPermissions.map((p) => p.id);

    await this.enforceEditPermissions(dto.data, definition, userPermissionIds);
    await this.validateData(dto.data, definition.fields, record.companyId);

    if (dto.ownerId !== undefined) record.ownerId = dto.ownerId;
    if (dto.ownerGroupId !== undefined) record.ownerGroupId = dto.ownerGroupId;
    record.data = dto.data;
    record.updatedBy = userId;
    return this.recordRepository.save(record);
  }

  async remove(id: string, userId: string): Promise<CustomObjectRecord> {
    const record = await this.findOne(id, userId);
    await this.recordRepository.remove(record);
    return { ...record, id };
  }

  private async filterReadFields(
    record: CustomObjectRecord,
    definition: CustomObjectDefinition,
    userPermissionIds: string[],
  ): Promise<CustomObjectRecord> {
    const filteredData = { ...record.data };
    for (const field of definition.fields) {
      const hasReadPerm = await this.permissionsService.hasPermissionByResourceType(
        userPermissionIds,
        'read',
        `co:${definition.code}:${field.code}`,
      );
      if (!hasReadPerm) {
        delete filteredData[field.code];
      }
    }
    record.data = filteredData;
    return record;
  }

  private async enforceEditPermissions(
    data: Record<string, any>,
    definition: CustomObjectDefinition,
    userPermissionIds: string[],
  ): Promise<void> {
    for (const field of definition.fields) {
      if (data[field.code] !== undefined) {
        const hasEditPerm = await this.permissionsService.hasPermissionByResourceType(
          userPermissionIds,
          'edit',
          `co:${definition.code}:${field.code}`,
        );
        if (!hasEditPerm) {
          throw new BadRequestException(`Insufficient permissions to edit field "${field.code}"`);
        }
      }
    }
  }

  private async validateData(
    data: Record<string, any>,
    fields: { code: string; dataType: CustomFieldType; isRequired: boolean; options: string[] | null; picklistId?: string | null; referencedDefinitionId?: string | null }[],
    companyId: string,
  ): Promise<void> {
    // Reject unknown keys (strict mode)
    const knownCodes = new Set(fields.map((f) => f.code));
    for (const key of Object.keys(data)) {
      if (!knownCodes.has(key)) {
        throw new BadRequestException(
          `Unknown field "${key}". Allowed fields: ${[...knownCodes].join(', ')}`,
        );
      }
    }

    for (const field of fields) {
      const value = data[field.code];

      if (field.isRequired && (value === undefined || value === null || value === '')) {
        throw new BadRequestException(
          `Field "${field.code}" is required`,
        );
      }

      if (value === undefined || value === null) continue;

      switch (field.dataType) {
        case CustomFieldType.STRING:
          if (typeof value !== 'string') {
            throw new BadRequestException(
              `Field "${field.code}" must be a string`,
            );
          }
          break;
        case CustomFieldType.NUMBER:
          if (typeof value !== 'number') {
            throw new BadRequestException(
              `Field "${field.code}" must be a number`,
            );
          }
          break;
        case CustomFieldType.STRING_ARRAY:
          if (!Array.isArray(value) || !value.every((v: any) => typeof v === 'string')) {
            throw new BadRequestException(
              `Field "${field.code}" must be an array of strings`,
            );
          }
          break;
        case CustomFieldType.NUMBER_ARRAY:
          if (!Array.isArray(value) || !value.every((v: any) => typeof v === 'number')) {
            throw new BadRequestException(
              `Field "${field.code}" must be an array of numbers`,
            );
          }
          break;
        case CustomFieldType.BOOLEAN:
          if (typeof value !== 'boolean') {
            throw new BadRequestException(
              `Field "${field.code}" must be a boolean`,
            );
          }
          break;
        case CustomFieldType.DATE:
          if (typeof value !== 'string' || isNaN(Date.parse(value))) {
            throw new BadRequestException(
              `Field "${field.code}" must be a valid date string`,
            );
          }
          break;
        case CustomFieldType.SELECT:
          if (
            field.options &&
            !field.options.includes(value)
          ) {
            throw new BadRequestException(
              `Field "${field.code}" must be one of: ${field.options.join(', ')}`,
            );
          }
          break;
        case CustomFieldType.USER:
          if (typeof value !== 'string') {
            throw new BadRequestException(
              `Field "${field.code}" must be a valid user/employee ID string`,
            );
          }
          break;
        case CustomFieldType.PICKLIST:
          if (typeof value !== 'string') {
            throw new BadRequestException(
              `Field "${field.code}" must be a valid picklist option code string`,
            );
          }
          if (field.picklistId) {
            const isValid = await this.picklistsService.isValidOptionCode(field.picklistId, companyId, value);
            if (!isValid) {
              throw new BadRequestException(`Field "${field.code}" contains an invalid picklist option code`);
            }
          }
          break;
        case CustomFieldType.CUSTOM_OBJECT:
          if (typeof value !== 'string') {
            throw new BadRequestException(
              `Field "${field.code}" must be a valid custom object record UUID string`,
            );
          }
          if (field.referencedDefinitionId) {
            const refRecord = await this.recordRepository.findOne(value);
            if (!refRecord || refRecord.definitionId !== field.referencedDefinitionId) {
              throw new BadRequestException(`Field "${field.code}" must reference a valid record of the specified definition`);
            }
          }
          break;
        case CustomFieldType.ATTACHMENT:
          if (typeof value !== 'string') {
            throw new BadRequestException(
              `Field "${field.code}" must be a valid attachment UUID string`,
            );
          }
          try {
            await this.attachmentsService.findOne(value);
          } catch (e) {
            throw new BadRequestException(`Field "${field.code}" must reference a valid uploaded attachment`);
          }
          break;
      }
    }
  }
}
