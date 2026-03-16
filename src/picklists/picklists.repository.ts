import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Picklist } from './entities/picklist.entity';
import { PicklistI18n } from './entities/picklist-i18n.entity';
import { PicklistOption } from './entities/picklist-option.entity';
import { PicklistOptionI18n } from './entities/picklist-option-i18n.entity';

// ── Picklist Repository ──────────────────────────────────────

export interface PicklistRepository {
  create(data: Partial<Picklist>): Picklist;
  save(entity: Picklist): Promise<Picklist>;
  findByCompany(companyId: string): Promise<Picklist[]>;
  findOne(id: string, companyId: string): Promise<Picklist | null>;
  remove(entity: Picklist): Promise<Picklist>;
}

@Injectable()
export class TypeOrmPicklistRepository implements PicklistRepository {
  private readonly repo: Repository<Picklist>;

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(Picklist);
  }

  create(data: Partial<Picklist>): Picklist {
    return this.repo.create(data);
  }

  save(entity: Picklist): Promise<Picklist> {
    return this.repo.save(entity);
  }

  findByCompany(companyId: string): Promise<Picklist[]> {
    return this.repo.find({
      where: { companyId },
      relations: ['translations', 'options', 'options.translations'],
      order: { code: 'ASC' },
    });
  }

  findOne(id: string, companyId: string): Promise<Picklist | null> {
    return this.repo.findOne({
      where: { id, companyId },
      relations: ['translations', 'options', 'options.translations'],
    });
  }

  remove(entity: Picklist): Promise<Picklist> {
    return this.repo.remove(entity);
  }
}

// ── PicklistI18n Repository ──────────────────────────────────

export interface PicklistI18nRepository {
  upsertForPicklist(
    companyId: string,
    picklistId: string,
    locale: string,
    data: { name: string; description?: string },
  ): Promise<PicklistI18n>;
}

@Injectable()
export class TypeOrmPicklistI18nRepository implements PicklistI18nRepository {
  private readonly repo: Repository<PicklistI18n>;

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(PicklistI18n);
  }

  async upsertForPicklist(
    companyId: string,
    picklistId: string,
    locale: string,
    data: { name: string; description?: string },
  ): Promise<PicklistI18n> {
    const existing = await this.repo.findOne({ where: { picklistId, locale } });
    if (existing) {
      existing.name = data.name;
      existing.description = data.description ?? existing.description;
      return this.repo.save(existing);
    }
    const entity = this.repo.create({
      companyId,
      picklistId,
      locale,
      name: data.name,
      description: data.description ?? null,
    });
    return this.repo.save(entity);
  }
}

// ── PicklistOption Repository ────────────────────────────────

export interface PicklistOptionRepository {
  create(data: Partial<PicklistOption>): PicklistOption;
  save(entity: PicklistOption): Promise<PicklistOption>;
  findOne(id: string, companyId: string): Promise<PicklistOption | null>;
  remove(entity: PicklistOption): Promise<PicklistOption>;
  deleteByPicklistId(picklistId: string): Promise<void>;
}

@Injectable()
export class TypeOrmPicklistOptionRepository implements PicklistOptionRepository {
  private readonly repo: Repository<PicklistOption>;

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(PicklistOption);
  }

  create(data: Partial<PicklistOption>): PicklistOption {
    return this.repo.create(data);
  }

  save(entity: PicklistOption): Promise<PicklistOption> {
    return this.repo.save(entity);
  }

  findOne(id: string, companyId: string): Promise<PicklistOption | null> {
    return this.repo.findOne({
      where: { id, companyId },
      relations: ['translations'],
    });
  }

  remove(entity: PicklistOption): Promise<PicklistOption> {
    return this.repo.remove(entity);
  }

  async deleteByPicklistId(picklistId: string): Promise<void> {
    await this.repo.delete({ picklistId });
  }
}

// ── PicklistOptionI18n Repository ────────────────────────────

export interface PicklistOptionI18nRepository {
  upsertForOption(
    companyId: string,
    picklistOptionId: string,
    locale: string,
    data: { label: string },
  ): Promise<PicklistOptionI18n>;
}

@Injectable()
export class TypeOrmPicklistOptionI18nRepository implements PicklistOptionI18nRepository {
  private readonly repo: Repository<PicklistOptionI18n>;

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(PicklistOptionI18n);
  }

  async upsertForOption(
    companyId: string,
    picklistOptionId: string,
    locale: string,
    data: { label: string },
  ): Promise<PicklistOptionI18n> {
    const existing = await this.repo.findOne({
      where: { picklistOptionId, locale },
    });
    if (existing) {
      existing.label = data.label;
      return this.repo.save(existing);
    }
    const entity = this.repo.create({
      companyId,
      picklistOptionId,
      locale,
      label: data.label,
    });
    return this.repo.save(entity);
  }
}
