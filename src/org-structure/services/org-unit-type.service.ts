import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { OrgUnitType } from '../entities/org-unit-type.entity';
import { OrgUnitTypeRepository } from '../repositories/org-unit-type.repository';
import { OrgUnitTypeI18nRepository } from '../repositories/org-unit-type.repository';
import { CreateOrgUnitTypeDto } from '../dto/create-org-unit-type.dto';
import { UpdateOrgUnitTypeDto } from '../dto/update-org-unit-type.dto';

/** Resolved label result after locale fallback */
export interface ResolvedOrgUnitType {
  id: string;
  companyId: string;
  slug: string;
  color: string | null;
  icon: string | null;
  createdAt: Date;
  /** Resolved name after fallback chain */
  name: string;
  /** Resolved short name (may be null) */
  shortName: string | null;
  /** Resolved description (may be null) */
  description: string | null;
  /** Locale that was used for resolution */
  resolvedLocale: string;
  /** All translations (only when includeTranslations=true) */
  translations?: Array<{
    locale: string;
    name: string;
    shortName: string | null;
    description: string | null;
  }>;
}

@Injectable()
export class OrgUnitTypeService {
  constructor(
    @Inject('OrgUnitTypeRepository')
    private readonly orgUnitTypeRepository: OrgUnitTypeRepository,
    @Inject('OrgUnitTypeI18nRepository')
    private readonly i18nRepository: OrgUnitTypeI18nRepository,
  ) {}

  // ── Create ────────────────────────────────────────────────────

  async create(
    companyId: string,
    dto: CreateOrgUnitTypeDto,
  ): Promise<OrgUnitType> {
    const locales = Object.keys(dto.translations || {});
    if (locales.length === 0) {
      throw new BadRequestException('At least one translation is required');
    }

    // Create base entity
    const entity = this.orgUnitTypeRepository.create({
      companyId,
      slug: dto.slug,
      color: dto.color ?? null,
      icon: dto.icon ?? null,
    });
    const saved = await this.orgUnitTypeRepository.save(entity);

    // Create i18n rows
    for (const locale of locales) {
      const t = dto.translations[locale];
      await this.i18nRepository.upsertForType(companyId, saved.id, locale, {
        name: t.name,
        shortName: t.shortName ?? null,
        description: t.description ?? null,
      });
    }

    // Return with translations loaded
    return this.orgUnitTypeRepository.findOne(saved.id, companyId);
  }

  // ── Find all (with locale resolution) ─────────────────────────

  async findAll(
    companyId: string,
    locale?: string,
    includeTranslations?: boolean,
  ): Promise<ResolvedOrgUnitType[]> {
    const entities = await this.orgUnitTypeRepository.findByCompany(companyId);
    return entities.map((e) =>
      this.resolveLabels(e, locale ?? 'en', includeTranslations),
    );
  }

  // ── Find one (with locale resolution) ─────────────────────────

  async findOneResolved(
    id: string,
    companyId: string,
    locale?: string,
    includeTranslations?: boolean,
  ): Promise<ResolvedOrgUnitType> {
    const entity = await this.orgUnitTypeRepository.findOne(id, companyId);
    if (!entity) {
      throw new NotFoundException(`OrgUnitType with ID "${id}" not found`);
    }
    return this.resolveLabels(entity, locale ?? 'en', includeTranslations);
  }

  /** Raw findOne for internal use (e.g. from seed) */
  async findOne(id: string, companyId: string): Promise<OrgUnitType> {
    const entity = await this.orgUnitTypeRepository.findOne(id, companyId);
    if (!entity) {
      throw new NotFoundException(`OrgUnitType with ID "${id}" not found`);
    }
    return entity;
  }

  // ── Update ────────────────────────────────────────────────────

  async update(
    id: string,
    companyId: string,
    dto: UpdateOrgUnitTypeDto,
  ): Promise<OrgUnitType> {
    const entity = await this.findOne(id, companyId);

    // Update base fields
    if (dto.slug !== undefined) entity.slug = dto.slug;
    if (dto.color !== undefined) entity.color = dto.color;
    if (dto.icon !== undefined) entity.icon = dto.icon;
    await this.orgUnitTypeRepository.save(entity);

    // Upsert translations
    if (dto.translations) {
      for (const [locale, t] of Object.entries(dto.translations)) {
        await this.i18nRepository.upsertForType(companyId, id, locale, {
          name: t.name,
          shortName: t.shortName ?? null,
          description: t.description ?? null,
        });
      }
    }

    return this.orgUnitTypeRepository.findOne(id, companyId);
  }

  // ── Remove ────────────────────────────────────────────────────

  async remove(id: string, companyId: string): Promise<OrgUnitType> {
    const entity = await this.findOne(id, companyId);
    return this.orgUnitTypeRepository.remove(entity);
  }

  // ── Locale fallback resolution ────────────────────────────────

  private resolveLabels(
    entity: OrgUnitType,
    requestedLocale: string,
    includeTranslations?: boolean,
  ): ResolvedOrgUnitType {
    const translations = entity.translations || [];

    // Fallback chain: requested → 'en' → first available → slug
    const match =
      translations.find((t) => t.locale === requestedLocale) ??
      translations.find((t) => t.locale === 'en') ??
      translations[0] ??
      null;

    const result: ResolvedOrgUnitType = {
      id: entity.id,
      companyId: entity.companyId,
      slug: entity.slug,
      color: entity.color,
      icon: entity.icon,
      createdAt: entity.createdAt,
      name: match?.name ?? entity.slug,
      shortName: match?.shortName ?? null,
      description: match?.description ?? null,
      resolvedLocale: match?.locale ?? 'slug',
    };

    if (includeTranslations) {
      result.translations = translations.map((t) => ({
        locale: t.locale,
        name: t.name,
        shortName: t.shortName,
        description: t.description,
      }));
    }

    return result;
  }
}
