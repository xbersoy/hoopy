import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  PicklistRepository,
  PicklistI18nRepository,
  PicklistOptionRepository,
  PicklistOptionI18nRepository,
} from './picklists.repository';
import { CreatePicklistDto } from './dto/create-picklist.dto';
import { UpdatePicklistDto } from './dto/update-picklist.dto';
import { CreatePicklistOptionDto } from './dto/create-picklist-option.dto';
import { UpdatePicklistOptionDto } from './dto/update-picklist-option.dto';
import { Picklist } from './entities/picklist.entity';
import { PicklistOption } from './entities/picklist-option.entity';

export interface ResolvedPicklistOption {
  id: string;
  companyId: string;
  picklistId: string;
  code: string;
  sortOrder: number;
  isActive: boolean;
  label: string;
  resolvedLocale: string;
  translations?: Record<string, { label: string }>;
}

export interface ResolvedPicklist {
  id: string;
  companyId: string;
  code: string;
  isActive: boolean;
  name: string;
  description?: string;
  resolvedLocale: string;
  options: ResolvedPicklistOption[];
  translations?: Record<string, { name: string; description?: string }>;
}

@Injectable()
export class PicklistsService {
  constructor(
    @Inject('PicklistRepository')
    private readonly picklistsRepo: PicklistRepository,
    @Inject('PicklistI18nRepository')
    private readonly picklistsI18nRepo: PicklistI18nRepository,
    @Inject('PicklistOptionRepository')
    private readonly optionsRepo: PicklistOptionRepository,
    @Inject('PicklistOptionI18nRepository')
    private readonly optionsI18nRepo: PicklistOptionI18nRepository,
  ) {}

  // ── PICKLISTS ──────────────────────────────────────────────

  async create(companyId: string, dto: CreatePicklistDto): Promise<Picklist> {
    const locales = Object.keys(dto.translations || {});
    if (locales.length === 0)
      throw new BadRequestException('Translations required');

    const entity = this.picklistsRepo.create({
      companyId,
      code: dto.code,
      isActive: dto.isActive ?? true,
    });
    const saved = await this.picklistsRepo.save(entity);

    for (const locale of locales) {
      await this.picklistsI18nRepo.upsertForPicklist(
        companyId,
        saved.id,
        locale,
        {
          name: dto.translations[locale].name,
          description: dto.translations[locale].description,
        },
      );
    }

    if (dto.options?.length) {
      for (const optDto of dto.options) {
        await this.createOption(companyId, saved.id, optDto);
      }
    }

    return this.picklistsRepo.findOne(saved.id, companyId);
  }

  async findAll(
    companyId: string,
    locale?: string,
    includeTranslations?: boolean,
  ): Promise<ResolvedPicklist[]> {
    const picklists = await this.picklistsRepo.findByCompany(companyId);
    return picklists.map((p) =>
      this.resolvePicklist(p, locale ?? 'en', includeTranslations),
    );
  }

  async findAllRaw(companyId: string): Promise<Picklist[]> {
    return this.picklistsRepo.findByCompany(companyId);
  }

  async findOneResolved(
    id: string,
    companyId: string,
    locale?: string,
    includeTranslations?: boolean,
  ): Promise<ResolvedPicklist> {
    const picklist = await this.picklistsRepo.findOne(id, companyId);
    if (!picklist) throw new NotFoundException('Picklist not found');
    return this.resolvePicklist(picklist, locale ?? 'en', includeTranslations);
  }

  async findOne(id: string, companyId: string): Promise<Picklist> {
    const picklist = await this.picklistsRepo.findOne(id, companyId);
    if (!picklist) throw new NotFoundException('Picklist not found');
    return picklist;
  }

  async update(
    id: string,
    companyId: string,
    dto: UpdatePicklistDto,
  ): Promise<Picklist> {
    const picklist = await this.findOne(id, companyId);
    if (dto.code !== undefined) picklist.code = dto.code;
    if (dto.isActive !== undefined) picklist.isActive = dto.isActive;
    await this.picklistsRepo.save(picklist);

    if (dto.translations) {
      for (const [locale, t] of Object.entries(dto.translations)) {
        await this.picklistsI18nRepo.upsertForPicklist(companyId, id, locale, {
          name: t.name,
          description: t.description,
        });
      }
    }

    if (dto.options) {
      await this.optionsRepo.deleteByPicklistId(id);
      for (const optDto of dto.options) {
        await this.createOption(companyId, id, optDto);
      }
    }

    return this.picklistsRepo.findOne(id, companyId);
  }

  async remove(id: string, companyId: string): Promise<Picklist> {
    const entity = await this.findOne(id, companyId);
    return this.picklistsRepo.remove(entity);
  }

  private resolvePicklist(
    picklist: Picklist,
    locale: string,
    includeTranslations?: boolean,
  ): ResolvedPicklist {
    const translations = picklist.translations || [];
    const match =
      translations.find((t) => t.locale === locale) ??
      translations.find((t) => t.locale === 'en') ??
      translations[0] ??
      null;

    const resolvedOptions = (picklist.options || [])
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((opt) => {
        const optTranslations = opt.translations || [];
        const optMatch =
          optTranslations.find((t) => t.locale === locale) ??
          optTranslations.find((t) => t.locale === 'en') ??
          optTranslations[0] ??
          null;
        const resolved: ResolvedPicklistOption = {
          id: opt.id,
          companyId: opt.companyId,
          picklistId: opt.picklistId,
          code: opt.code,
          sortOrder: opt.sortOrder,
          isActive: opt.isActive,
          label: optMatch?.label ?? opt.code,
          resolvedLocale: optMatch?.locale ?? 'code',
        };
        if (includeTranslations) {
          resolved.translations = {};
          for (const t of optTranslations) {
            resolved.translations[t.locale] = { label: t.label };
          }
        }
        return resolved;
      });

    const result: ResolvedPicklist = {
      id: picklist.id,
      companyId: picklist.companyId,
      code: picklist.code,
      isActive: picklist.isActive,
      name: match?.name ?? picklist.code,
      description: match?.description ?? undefined,
      resolvedLocale: match?.locale ?? 'code',
      options: resolvedOptions,
    };

    if (includeTranslations) {
      result.translations = {};
      for (const t of translations) {
        result.translations[t.locale] = {
          name: t.name,
          ...(t.description ? { description: t.description } : {}),
        };
      }
    }

    return result;
  }

  // ── PICKLIST OPTIONS ───────────────────────────────────────

  async createOption(
    companyId: string,
    picklistId: string,
    dto: CreatePicklistOptionDto,
  ): Promise<PicklistOption> {
    await this.findOne(picklistId, companyId);
    if (!Object.keys(dto.translations || {}).length)
      throw new BadRequestException('Translations required for option');

    const entity = this.optionsRepo.create({
      companyId,
      picklistId,
      code: dto.code,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
    });
    const saved = await this.optionsRepo.save(entity);

    for (const locale of Object.keys(dto.translations)) {
      await this.optionsI18nRepo.upsertForOption(companyId, saved.id, locale, {
        label: dto.translations[locale].label,
      });
    }
    return this.optionsRepo.findOne(saved.id, companyId);
  }

  async updateOption(
    id: string,
    companyId: string,
    dto: UpdatePicklistOptionDto,
  ): Promise<PicklistOption> {
    const option = await this.optionsRepo.findOne(id, companyId);
    if (!option) throw new NotFoundException('Picklist Option not found');

    if (dto.code !== undefined) option.code = dto.code;
    if (dto.sortOrder !== undefined) option.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) option.isActive = dto.isActive;
    await this.optionsRepo.save(option);

    if (dto.translations) {
      for (const [locale, t] of Object.entries(dto.translations)) {
        await this.optionsI18nRepo.upsertForOption(companyId, id, locale, {
          label: t.label,
        });
      }
    }
    return this.optionsRepo.findOne(id, companyId);
  }

  async removeOption(id: string, companyId: string): Promise<PicklistOption> {
    const option = await this.optionsRepo.findOne(id, companyId);
    if (!option) throw new NotFoundException('Picklist Option not found');
    return this.optionsRepo.remove(option);
  }

  async isValidOptionCode(
    picklistId: string,
    companyId: string,
    code: string,
  ): Promise<boolean> {
    const picklist = await this.picklistsRepo.findOne(picklistId, companyId);
    if (!picklist || !picklist.options) return false;
    return picklist.options.some((opt) => opt.code === code && opt.isActive);
  }
}
