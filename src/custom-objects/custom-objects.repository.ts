import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository, ILike, FindOptionsWhere } from 'typeorm';
import { CustomObjectDefinition } from './entities/custom-object-definition.entity';
import { CustomObjectDefinitionI18n } from './entities/custom-object-definition-i18n.entity';
import { CustomObjectField } from './entities/custom-object-field.entity';
import { CustomObjectFieldI18n } from './entities/custom-object-field-i18n.entity';
import { CustomObjectRecord } from './entities/custom-object-record.entity';

// --- Interfaces ---

export interface CustomObjectDefinitionRepository {
  create(data: Partial<CustomObjectDefinition>): CustomObjectDefinition;
  save(definition: CustomObjectDefinition): Promise<CustomObjectDefinition>;
  findPaginated(options: {
    companyId: string;
    search?: string;
    baseObjectType?: string;
    page: number;
    limit: number;
  }): Promise<{ data: CustomObjectDefinition[]; total: number }>;
  findByBaseObjectType(companyId: string, baseObjectType: string): Promise<CustomObjectDefinition[]>;
  findAllWithFields(): Promise<CustomObjectDefinition[]>;
  findOneWithFields(id: string, companyId?: string): Promise<CustomObjectDefinition | null>;
  remove(definition: CustomObjectDefinition): Promise<CustomObjectDefinition>;
}

export interface CustomObjectFieldRepository {
  create(data: Partial<CustomObjectField>): CustomObjectField;
  saveAll(fields: CustomObjectField[]): Promise<CustomObjectField[]>;
  deleteByDefinitionId(definitionId: string): Promise<void>;
}

export interface CustomObjectDefinitionI18nRepository {
  upsertForDefinition(
    companyId: string,
    definitionId: string,
    locale: string,
    data: { name: string; description?: string | null; pluralName?: string | null },
  ): Promise<CustomObjectDefinitionI18n>;
}

export interface CustomObjectFieldI18nRepository {
  upsertForField(
    companyId: string,
    fieldId: string,
    locale: string,
    data: { label: string; description?: string | null },
  ): Promise<CustomObjectFieldI18n>;
}

export interface CustomObjectRecordRepository {
  create(data: Partial<CustomObjectRecord>): CustomObjectRecord;
  save(record: CustomObjectRecord): Promise<CustomObjectRecord>;
  findPaginatedByDefinition(options: {
    definitionId: string;
    companyId: string;
    baseObjectId?: string;
    page: number;
    limit: number;
  }): Promise<{ data: CustomObjectRecord[]; total: number }>;
  findOne(id: string): Promise<CustomObjectRecord | null>;
  remove(record: CustomObjectRecord): Promise<CustomObjectRecord>;
}

// --- Implementations ---

@Injectable()
export class TypeOrmCustomObjectDefinitionRepository
  implements CustomObjectDefinitionRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    this.repo = this.dataSource.getRepository(CustomObjectDefinition);
  }

  private readonly repo: Repository<CustomObjectDefinition>;

  create(data: Partial<CustomObjectDefinition>): CustomObjectDefinition {
    return this.repo.create(data);
  }

  save(
    definition: CustomObjectDefinition,
  ): Promise<CustomObjectDefinition> {
    return this.repo.save(definition);
  }

  async findPaginated(options: {
    companyId: string;
    search?: string;
    baseObjectType?: string;
    page: number;
    limit: number;
  }): Promise<{ data: CustomObjectDefinition[]; total: number }> {
    const { companyId, search, baseObjectType, page, limit } = options;

    const whereBase: FindOptionsWhere<CustomObjectDefinition> = { companyId };
    if (baseObjectType) {
      whereBase.baseObjectType = baseObjectType;
    }

    const where: FindOptionsWhere<CustomObjectDefinition>[] = search
      ? [
        { ...whereBase, label: ILike(`%${search}%`) },
        { ...whereBase, code: ILike(`%${search}%`) },
      ]
      : [whereBase];

    const [data, total] = await this.repo.findAndCount({
      where,
      relations: ['translations', 'fields', 'fields.translations'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  async findByBaseObjectType(companyId: string, baseObjectType: string): Promise<CustomObjectDefinition[]> {
    return this.repo.find({
      where: { companyId, baseObjectType, isActive: true },
      relations: ['translations', 'fields', 'fields.translations'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllWithFields(): Promise<CustomObjectDefinition[]> {
    return this.repo.find({
      relations: ['fields'],
    });
  }

  findOneWithFields(id: string, companyId?: string): Promise<CustomObjectDefinition | null> {
    const where: FindOptionsWhere<CustomObjectDefinition> = { id };
    if (companyId) {
      where.companyId = companyId;
    }
    return this.repo.findOne({
      where,
      relations: ['translations', 'fields', 'fields.translations'],
    });
  }

  remove(
    definition: CustomObjectDefinition,
  ): Promise<CustomObjectDefinition> {
    return this.repo.remove(definition);
  }
}

@Injectable()
export class TypeOrmCustomObjectFieldRepository
  implements CustomObjectFieldRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    this.repo = this.dataSource.getRepository(CustomObjectField);
  }

  private readonly repo: Repository<CustomObjectField>;

  create(data: Partial<CustomObjectField>): CustomObjectField {
    return this.repo.create(data);
  }

  saveAll(fields: CustomObjectField[]): Promise<CustomObjectField[]> {
    return this.repo.save(fields);
  }

  async deleteByDefinitionId(definitionId: string): Promise<void> {
    await this.repo.delete({ definitionId });
  }
}

@Injectable()
export class TypeOrmCustomObjectDefinitionI18nRepository implements CustomObjectDefinitionI18nRepository {
  private readonly repo: Repository<CustomObjectDefinitionI18n>;

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(CustomObjectDefinitionI18n);
  }

  async upsertForDefinition(companyId: string, definitionId: string, locale: string, data: { name: string; description?: string | null; pluralName?: string | null }): Promise<CustomObjectDefinitionI18n> {
    let existing = await this.repo.findOne({ where: { definitionId, locale } });
    if (existing) {
      existing.name = data.name;
      existing.description = data.description ?? existing.description;
      existing.pluralName = data.pluralName ?? existing.pluralName;
      return this.repo.save(existing);
    }
    const entity = this.repo.create({ companyId, definitionId, locale, name: data.name, description: data.description ?? null, pluralName: data.pluralName ?? null });
    return this.repo.save(entity);
  }
}

@Injectable()
export class TypeOrmCustomObjectFieldI18nRepository implements CustomObjectFieldI18nRepository {
  private readonly repo: Repository<CustomObjectFieldI18n>;

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(CustomObjectFieldI18n);
  }

  async upsertForField(companyId: string, fieldId: string, locale: string, data: { label: string; description?: string | null }): Promise<CustomObjectFieldI18n> {
    let existing = await this.repo.findOne({ where: { fieldId, locale } });
    if (existing) {
      existing.label = data.label;
      existing.description = data.description ?? existing.description;
      return this.repo.save(existing);
    }
    const entity = this.repo.create({ companyId, fieldId, locale, label: data.label, description: data.description ?? null });
    return this.repo.save(entity);
  }
}

@Injectable()
export class TypeOrmCustomObjectRecordRepository
  implements CustomObjectRecordRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    this.repo = this.dataSource.getRepository(CustomObjectRecord);
  }

  private readonly repo: Repository<CustomObjectRecord>;

  create(data: Partial<CustomObjectRecord>): CustomObjectRecord {
    return this.repo.create(data);
  }

  save(record: CustomObjectRecord): Promise<CustomObjectRecord> {
    return this.repo.save(record);
  }

  async findPaginatedByDefinition(options: {
    definitionId: string;
    companyId: string;
    baseObjectId?: string;
    page: number;
    limit: number;
  }): Promise<{ data: CustomObjectRecord[]; total: number }> {
    const { definitionId, companyId, baseObjectId, page, limit } = options;

    const where: FindOptionsWhere<CustomObjectRecord> = { definitionId, companyId };
    if (baseObjectId) {
      where.baseObjectId = baseObjectId;
    }

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  findOne(id: string): Promise<CustomObjectRecord | null> {
    return this.repo.findOne({ where: { id } });
  }

  remove(record: CustomObjectRecord): Promise<CustomObjectRecord> {
    return this.repo.remove(record);
  }
}
