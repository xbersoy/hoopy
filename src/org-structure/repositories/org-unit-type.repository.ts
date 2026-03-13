import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { OrgUnitType } from '../entities/org-unit-type.entity';
import { OrgUnitTypeI18n } from '../entities/org-unit-type-i18n.entity';

// ── OrgUnitType Repository ──────────────────────────────────────

export interface OrgUnitTypeRepository {
  create(data: Partial<OrgUnitType>): OrgUnitType;
  save(entity: OrgUnitType): Promise<OrgUnitType>;
  findByCompany(companyId: string): Promise<OrgUnitType[]>;
  findOne(id: string, companyId: string): Promise<OrgUnitType | null>;
  remove(entity: OrgUnitType): Promise<OrgUnitType>;
}

@Injectable()
export class TypeOrmOrgUnitTypeRepository implements OrgUnitTypeRepository {
  private readonly repo: Repository<OrgUnitType>;

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    this.repo = this.dataSource.getRepository(OrgUnitType);
  }

  create(data: Partial<OrgUnitType>): OrgUnitType {
    return this.repo.create(data);
  }

  save(entity: OrgUnitType): Promise<OrgUnitType> {
    return this.repo.save(entity);
  }

  findByCompany(companyId: string): Promise<OrgUnitType[]> {
    return this.repo.find({
      where: { companyId },
      relations: ['translations'],
      order: { slug: 'ASC' },
    });
  }

  findOne(id: string, companyId: string): Promise<OrgUnitType | null> {
    return this.repo.findOne({
      where: { id, companyId },
      relations: ['translations'],
    });
  }

  remove(entity: OrgUnitType): Promise<OrgUnitType> {
    return this.repo.remove(entity);
  }
}

// ── OrgUnitTypeI18n Repository ──────────────────────────────────

export interface OrgUnitTypeI18nRepository {
  create(data: Partial<OrgUnitTypeI18n>): OrgUnitTypeI18n;
  save(entity: OrgUnitTypeI18n): Promise<OrgUnitTypeI18n>;
  saveAll(entities: OrgUnitTypeI18n[]): Promise<OrgUnitTypeI18n[]>;
  findByTypeAndLocale(
    orgUnitTypeId: string,
    locale: string,
  ): Promise<OrgUnitTypeI18n | null>;
  upsertForType(
    companyId: string,
    orgUnitTypeId: string,
    locale: string,
    data: {
      name: string;
      shortName?: string | null;
      description?: string | null;
    },
  ): Promise<OrgUnitTypeI18n>;
  deleteByTypeId(orgUnitTypeId: string): Promise<void>;
}

@Injectable()
export class TypeOrmOrgUnitTypeI18nRepository implements OrgUnitTypeI18nRepository {
  private readonly repo: Repository<OrgUnitTypeI18n>;

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    this.repo = this.dataSource.getRepository(OrgUnitTypeI18n);
  }

  create(data: Partial<OrgUnitTypeI18n>): OrgUnitTypeI18n {
    return this.repo.create(data);
  }

  save(entity: OrgUnitTypeI18n): Promise<OrgUnitTypeI18n> {
    return this.repo.save(entity);
  }

  saveAll(entities: OrgUnitTypeI18n[]): Promise<OrgUnitTypeI18n[]> {
    return this.repo.save(entities);
  }

  findByTypeAndLocale(
    orgUnitTypeId: string,
    locale: string,
  ): Promise<OrgUnitTypeI18n | null> {
    return this.repo.findOne({
      where: { orgUnitTypeId, locale },
    });
  }

  async upsertForType(
    companyId: string,
    orgUnitTypeId: string,
    locale: string,
    data: {
      name: string;
      shortName?: string | null;
      description?: string | null;
    },
  ): Promise<OrgUnitTypeI18n> {
    const existing = await this.findByTypeAndLocale(orgUnitTypeId, locale);
    if (existing) {
      existing.name = data.name;
      existing.shortName = data.shortName ?? existing.shortName;
      existing.description = data.description ?? existing.description;
      return this.repo.save(existing);
    }
    const entity = this.repo.create({
      companyId,
      orgUnitTypeId,
      locale,
      name: data.name,
      shortName: data.shortName ?? null,
      description: data.description ?? null,
    });
    return this.repo.save(entity);
  }

  async deleteByTypeId(orgUnitTypeId: string): Promise<void> {
    await this.repo.delete({ orgUnitTypeId });
  }
}
