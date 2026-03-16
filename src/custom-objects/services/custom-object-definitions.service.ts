import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { CreateCustomObjectDefinitionDto } from '../dto/create-custom-object-definition.dto';
import { UpdateCustomObjectDefinitionDto } from '../dto/update-custom-object-definition.dto';
import { QueryCustomObjectDefinitionDto } from '../dto/query-custom-object-definition.dto';
import { PaginatedResponse } from '../../shared/dto';
import { CustomObjectDefinition } from '../entities/custom-object-definition.entity';
import {
  CustomObjectDefinitionRepository,
  CustomObjectFieldRepository,
  CustomObjectDefinitionI18nRepository,
  CustomObjectFieldI18nRepository,
} from '../custom-objects.repository';
import { CustomObjectPermissionsService } from '../../permissions/services/custom-object-permissions.service';

@Injectable()
export class CustomObjectDefinitionsService implements OnModuleInit {
  private readonly logger = new Logger(CustomObjectDefinitionsService.name);

  constructor(
    @Inject('CustomObjectDefinitionRepository')
    private readonly definitionRepository: CustomObjectDefinitionRepository,

    @Inject('CustomObjectFieldRepository')
    private readonly fieldRepository: CustomObjectFieldRepository,

    @Inject('CustomObjectDefinitionI18nRepository')
    private readonly definitionI18nRepo: CustomObjectDefinitionI18nRepository,

    @Inject('CustomObjectFieldI18nRepository')
    private readonly fieldI18nRepo: CustomObjectFieldI18nRepository,

    private readonly customObjectPermissionsService: CustomObjectPermissionsService,
  ) {}

  async onModuleInit(): Promise<void> {
    const definitions = await this.definitionRepository.findAllWithFields();
    if (!definitions.length) return;

    this.logger.log(
      `Syncing permissions for ${definitions.length} custom object definition(s)...`,
    );
    for (const def of definitions) {
      await this.syncPermissions(def);
    }
    this.logger.log('Custom object permissions sync complete.');
  }

  async create(
    dto: CreateCustomObjectDefinitionDto,
    companyId: string,
    userId: string,
  ): Promise<CustomObjectDefinition> {
    const { fields, translations, ...definitionData } = dto;

    const definition = this.definitionRepository.create({
      ...definitionData,
      companyId,
      createdBy: userId,
      updatedBy: userId,
    });
    const savedDefinition = await this.definitionRepository.save(definition);

    if (translations) {
      for (const [locale, tDto] of Object.entries(translations)) {
        await this.definitionI18nRepo.upsertForDefinition(
          companyId,
          savedDefinition.id,
          locale,
          tDto,
        );
      }
    }

    if (fields?.length) {
      for (const fieldDto of fields) {
        const { translations: fieldTranslations, ...fieldData } = fieldDto;
        const fieldEntity = this.fieldRepository.create({
          ...fieldData,
          definitionId: savedDefinition.id,
        });
        const [savedField] = await this.fieldRepository.saveAll([fieldEntity]);

        if (fieldTranslations) {
          for (const [locale, ftDto] of Object.entries(fieldTranslations)) {
            await this.fieldI18nRepo.upsertForField(
              companyId,
              savedField.id,
              locale,
              ftDto,
            );
          }
        }
      }
    }

    const result = await this.findOne(savedDefinition.id);
    await this.syncPermissions(result);
    return result;
  }

  async findAll(
    companyId: string,
    query: QueryCustomObjectDefinitionDto,
  ): Promise<PaginatedResponse<CustomObjectDefinition>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { data, total } = await this.definitionRepository.findPaginated({
      companyId,
      search: query.search,
      baseObjectType: query.baseObjectType,
      page,
      limit,
    });

    const mappedData = data.map((d) =>
      this.mapTranslations(d),
    ) as CustomObjectDefinition[];
    return { data: mappedData, total, page, limit };
  }

  async findByBaseObjectType(
    companyId: string,
    baseObjectType: string,
  ): Promise<CustomObjectDefinition[]> {
    const data = await this.definitionRepository.findByBaseObjectType(
      companyId,
      baseObjectType,
    );
    return data.map((d) => this.mapTranslations(d)) as CustomObjectDefinition[];
  }

  async findOne(
    id: string,
    companyId?: string,
  ): Promise<CustomObjectDefinition> {
    const definition = await this.definitionRepository.findOneWithFields(
      id,
      companyId,
    );
    if (!definition) {
      throw new NotFoundException(
        `Custom object definition with ID "${id}" not found`,
      );
    }
    return this.mapTranslations(definition);
  }

  async update(
    id: string,
    dto: UpdateCustomObjectDefinitionDto,
    userId: string,
    companyId: string,
  ): Promise<CustomObjectDefinition> {
    const definition = await this.findOne(id, companyId);
    const { fields, translations, ...definitionData } = dto;

    if (Object.keys(definitionData).length > 0) {
      Object.assign(definition, { ...definitionData, updatedBy: userId });
      await this.definitionRepository.save(definition);
    }

    if (translations) {
      for (const [locale, tDto] of Object.entries(translations)) {
        await this.definitionI18nRepo.upsertForDefinition(
          companyId,
          id,
          locale,
          tDto,
        );
      }
    }

    if (fields) {
      await this.fieldRepository.deleteByDefinitionId(id);
      if (fields.length > 0) {
        for (const fieldDto of fields) {
          const { translations: fieldTranslations, ...fieldData } = fieldDto;
          const fieldEntity = this.fieldRepository.create({
            ...fieldData,
            definitionId: id,
          });
          const [savedField] = await this.fieldRepository.saveAll([
            fieldEntity,
          ]);

          if (fieldTranslations) {
            for (const [locale, ftDto] of Object.entries(fieldTranslations)) {
              await this.fieldI18nRepo.upsertForField(
                companyId,
                savedField.id,
                locale,
                ftDto,
              );
            }
          }
        }
      }
    }

    const result = await this.findOne(id);
    await this.syncPermissions(result);
    return result;
  }

  async remove(id: string, companyId: string): Promise<CustomObjectDefinition> {
    const definition = await this.findOne(id, companyId);
    await this.customObjectPermissionsService.removePermissionsForDefinition(
      definition.code,
    );
    await this.definitionRepository.remove(definition);
    return { ...definition, id };
  }

  private mapTranslations(definition: any): CustomObjectDefinition {
    if (definition.translations && Array.isArray(definition.translations)) {
      const transMap: Record<string, any> = {};
      for (const t of definition.translations) {
        transMap[t.locale] = {
          name: t.name,
          description: t.description,
          pluralName: t.pluralName,
        };
      }
      definition.translations = transMap as any;
    }

    if (definition.fields && Array.isArray(definition.fields)) {
      for (const f of definition.fields) {
        if (f.translations && Array.isArray(f.translations)) {
          const fTransMap: Record<string, any> = {};
          for (const t of f.translations) {
            fTransMap[t.locale] = {
              label: t.label,
              description: t.description,
            };
          }
          f.translations = fTransMap as any;
        }
      }
    }

    return definition;
  }

  private async syncPermissions(
    definition: CustomObjectDefinition,
  ): Promise<void> {
    const fields = (definition.fields ?? []).map((f) => ({
      code: f.code,
      label: f.label,
    }));
    await this.customObjectPermissionsService.syncPermissionsForDefinition(
      definition.code,
      definition.label,
      fields,
    );
  }
}
