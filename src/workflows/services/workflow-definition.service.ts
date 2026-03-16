import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import {
  WorkflowDefinition,
  WorkflowDefinitionI18n,
  WorkflowDefinitionVersion,
  WorkflowStepDefinition,
  WorkflowStepI18n,
  WorkflowTransitionDefinition,
} from '../entities';
import {
  CreateWorkflowDefinitionDto,
  UpdateWorkflowDefinitionDto,
  UpdateWorkflowVersionDraftDto,
} from '../dto/workflow-definition.dto';
import { WorkflowDefinitionStatus } from '../enums/workflow.enums';

@Injectable()
export class WorkflowDefinitionService {
  constructor(
    @InjectRepository(WorkflowDefinition)
    private readonly definitionRepo: Repository<WorkflowDefinition>,
    @InjectRepository(WorkflowDefinitionVersion)
    private readonly versionRepo: Repository<WorkflowDefinitionVersion>,
    @InjectRepository(WorkflowStepDefinition)
    private readonly stepRepo: Repository<WorkflowStepDefinition>,
    @InjectRepository(WorkflowTransitionDefinition)
    private readonly transitionRepo: Repository<WorkflowTransitionDefinition>,
    private readonly dataSource: DataSource,
  ) {}

  // ─── Definitions ───

  async findAllByCompany(companyId: string): Promise<WorkflowDefinition[]> {
    return this.definitionRepo.find({
      where: { companyId },
      relations: ['translations'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOneById(companyId: string, id: string, entityManager?: EntityManager): Promise<WorkflowDefinition> {
    const repo = entityManager ? entityManager.getRepository(WorkflowDefinition) : this.definitionRepo;
    const def = await repo.findOne({
      where: { id, companyId },
      relations: ['versions', 'translations'],
    });
    if (!def) throw new NotFoundException('Workflow definition not found');
    return def;
  }

  async findByCode(companyId: string, code: string): Promise<WorkflowDefinition> {
    const def = await this.definitionRepo.findOne({
      where: { code, companyId },
      relations: ['versions'],
    });
    if (!def) throw new NotFoundException(`Workflow definition "${code}" not found`);
    return def;
  }

  async create(companyId: string, dto: CreateWorkflowDefinitionDto): Promise<WorkflowDefinition> {
    return this.dataSource.transaction(async (manager) => {
      // Create definition
      const definition = manager.create(WorkflowDefinition, {
        companyId,
        code: dto.code,
        resourceType: dto.resourceType,
        category: dto.category,
        priority: dto.priority ?? 0,
        stateMachineDefinitionId: dto.stateMachineDefinitionId,
      });
      const savedDef = await manager.save(WorkflowDefinition, definition);

      // Save definition translations
      for (const t of dto.translations) {
        await manager.save(WorkflowDefinitionI18n, manager.create(WorkflowDefinitionI18n, {
          companyId,
          definitionId: savedDef.id,
          locale: t.locale,
          name: t.name,
          description: t.description,
        }));
      }

      // Create version 1 as draft
      const version = manager.create(WorkflowDefinitionVersion, {
        definitionId: savedDef.id,
        version: 1,
        status: WorkflowDefinitionStatus.DRAFT,
        triggerMode: dto.triggerMode,
        entryCriteria: dto.entryCriteria,
        notificationConfig: dto.notificationConfig,
        slaConfig: dto.slaConfig,
        behaviorConfig: dto.behaviorConfig,
      });
      const savedVersion = await manager.save(WorkflowDefinitionVersion, version);

      // Create steps
      const stepEntities: WorkflowStepDefinition[] = [];
      for (const stepDto of dto.steps) {
        const { translations: stepTranslations, ...stepData } = stepDto;
        const step = manager.create(WorkflowStepDefinition, {
          versionId: savedVersion.id,
          ...stepData,
        });
        const savedStep = await manager.save(WorkflowStepDefinition, step);
        stepEntities.push(savedStep);

        // Save step translations
        if (stepTranslations) {
          for (const t of stepTranslations) {
            await manager.save(WorkflowStepI18n, manager.create(WorkflowStepI18n, {
              companyId,
              stepId: savedStep.id,
              locale: t.locale,
              name: t.name,
              description: t.description,
            }));
          }
        }
      }

      // Create transitions (resolve step codes to IDs)
      const stepCodeToId = new Map(stepEntities.map((s) => [s.code, s.id]));
      for (const transDto of dto.transitions) {
        const fromStepId = stepCodeToId.get(transDto.fromStepCode);
        if (!fromStepId) {
          throw new BadRequestException(`Invalid from step code: "${transDto.fromStepCode}"`);
        }
        const toStepId = transDto.toStepCode ? stepCodeToId.get(transDto.toStepCode) : null;
        if (transDto.toStepCode && !toStepId) {
          throw new BadRequestException(`Invalid to step code: "${transDto.toStepCode}"`);
        }

        const transition = manager.create(WorkflowTransitionDefinition, {
          versionId: savedVersion.id,
          fromStepId,
          toStepId,
          action: transDto.action,
          condition: transDto.condition,
          priority: transDto.priority ?? 0,
          isDefault: transDto.isDefault ?? false,
          label: transDto.label,
        });
        await manager.save(WorkflowTransitionDefinition, transition);
      }

      return this.findOneById(companyId, savedDef.id, manager);
    });
  }

  async update(
    companyId: string,
    id: string,
    dto: UpdateWorkflowDefinitionDto,
  ): Promise<WorkflowDefinition> {
    const def = await this.findOneById(companyId, id);
    Object.assign(def, dto);
    return this.definitionRepo.save(def);
  }

  async remove(companyId: string, id: string): Promise<void> {
    const def = await this.findOneById(companyId, id);
    await this.definitionRepo.remove(def);
  }

  // ─── Versions ───

  async getVersion(companyId: string, definitionId: string, versionId: string) {
    const def = await this.findOneById(companyId, definitionId);
    const version = await this.versionRepo.findOne({
      where: { id: versionId, definitionId: def.id },
      relations: ['steps', 'transitions'],
    });
    if (!version) throw new NotFoundException('Version not found');
    return version;
  }

  async getPublishedVersion(companyId: string, definitionId: string) {
    const def = await this.findOneById(companyId, definitionId);
    const version = await this.versionRepo.findOne({
      where: { definitionId: def.id, status: WorkflowDefinitionStatus.PUBLISHED },
      relations: ['steps', 'transitions'],
      order: { version: 'DESC' },
    });
    if (!version) throw new NotFoundException('No published version found');
    return version;
  }

  async getPublishedVersionByCode(companyId: string, workflowCode: string) {
    const def = await this.findByCode(companyId, workflowCode);
    if (!def.isActive) {
      throw new BadRequestException(`Workflow "${workflowCode}" is not active`);
    }
    const version = await this.versionRepo.findOne({
      where: { definitionId: def.id, status: WorkflowDefinitionStatus.PUBLISHED },
      relations: ['steps', 'transitions'],
      order: { version: 'DESC' },
    });
    if (!version) throw new NotFoundException(`No published version for workflow "${workflowCode}"`);
    return { definition: def, version };
  }

  async createNewVersion(companyId: string, definitionId: string): Promise<WorkflowDefinitionVersion> {
    const def = await this.findOneById(companyId, definitionId);
    const latestVersion = await this.versionRepo.findOne({
      where: { definitionId: def.id },
      order: { version: 'DESC' },
    });

    const newVersionNumber = (latestVersion?.version ?? 0) + 1;
    const version = this.versionRepo.create({
      definitionId: def.id,
      version: newVersionNumber,
      status: WorkflowDefinitionStatus.DRAFT,
    });
    return this.versionRepo.save(version);
  }

  async updateVersionDraft(
    companyId: string,
    definitionId: string,
    versionId: string,
    dto: UpdateWorkflowVersionDraftDto,
  ): Promise<WorkflowDefinitionVersion> {
    const version = await this.getVersion(companyId, definitionId, versionId);
    if (version.status !== WorkflowDefinitionStatus.DRAFT) {
      throw new ConflictException('Only draft versions can be updated');
    }

    return this.dataSource.transaction(async (manager) => {
      // Update version fields
      if (dto.triggerMode !== undefined) version.triggerMode = dto.triggerMode;
      if (dto.entryCriteria !== undefined) version.entryCriteria = dto.entryCriteria;
      if (dto.notificationConfig !== undefined) version.notificationConfig = dto.notificationConfig;
      if (dto.slaConfig !== undefined) version.slaConfig = dto.slaConfig;
      if (dto.behaviorConfig !== undefined) version.behaviorConfig = dto.behaviorConfig;
      if (dto.changeNotes !== undefined) version.changeNotes = dto.changeNotes;
      await manager.save(WorkflowDefinitionVersion, version);

      // Replace steps if provided
      if (dto.steps) {
        await manager.delete(WorkflowStepDefinition, { versionId: version.id });
        for (const stepDto of dto.steps) {
          const step = manager.create(WorkflowStepDefinition, {
            versionId: version.id,
            ...stepDto,
          });
          await manager.save(WorkflowStepDefinition, step);
        }
      }

      // Replace transitions if provided
      if (dto.transitions) {
        await manager.delete(WorkflowTransitionDefinition, { versionId: version.id });

        // Fetch fresh steps for code→id mapping
        const steps = await manager.find(WorkflowStepDefinition, {
          where: { versionId: version.id },
        });
        const stepCodeToId = new Map(steps.map((s) => [s.code, s.id]));

        for (const transDto of dto.transitions) {
          const fromStepId = stepCodeToId.get(transDto.fromStepCode);
          if (!fromStepId) {
            throw new BadRequestException(`Invalid from step code: "${transDto.fromStepCode}"`);
          }
          const toStepId = transDto.toStepCode ? stepCodeToId.get(transDto.toStepCode) : null;
          if (transDto.toStepCode && !toStepId) {
            throw new BadRequestException(`Invalid to step code: "${transDto.toStepCode}"`);
          }

          const transition = manager.create(WorkflowTransitionDefinition, {
            versionId: version.id,
            fromStepId,
            toStepId,
            action: transDto.action,
            condition: transDto.condition,
            priority: transDto.priority ?? 0,
            isDefault: transDto.isDefault ?? false,
            label: transDto.label,
          });
          await manager.save(WorkflowTransitionDefinition, transition);
        }
      }

      return this.getVersion(companyId, definitionId, versionId);
    });
  }

  async publishVersion(
    companyId: string,
    definitionId: string,
    versionId: string,
  ): Promise<WorkflowDefinitionVersion> {
    return this.dataSource.transaction(async (manager) => {
      const def = await this.findOneById(companyId, definitionId);

      const version = await manager.findOne(WorkflowDefinitionVersion, {
        where: { id: versionId, definitionId: def.id },
        relations: ['steps', 'transitions'],
      });
      if (!version) throw new NotFoundException('Version not found');
      if (version.status !== WorkflowDefinitionStatus.DRAFT) {
        throw new ConflictException('Only draft versions can be published');
      }
      if (!version.steps?.length) {
        throw new BadRequestException('Cannot publish a version with no steps');
      }

      // Archive any currently published version
      await manager.update(
        WorkflowDefinitionVersion,
        { definitionId: def.id, status: WorkflowDefinitionStatus.PUBLISHED },
        { status: WorkflowDefinitionStatus.ARCHIVED },
      );

      // Publish this version
      version.status = WorkflowDefinitionStatus.PUBLISHED;
      version.publishedAt = new Date();
      return manager.save(WorkflowDefinitionVersion, version);
    });
  }

  async archiveVersion(
    companyId: string,
    definitionId: string,
    versionId: string,
  ): Promise<WorkflowDefinitionVersion> {
    const version = await this.getVersion(companyId, definitionId, versionId);
    if (version.status === WorkflowDefinitionStatus.ARCHIVED) {
      throw new ConflictException('Version is already archived');
    }
    version.status = WorkflowDefinitionStatus.ARCHIVED;
    return this.versionRepo.save(version);
  }
}
