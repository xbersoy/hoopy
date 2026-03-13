import { Inject, Injectable } from '@nestjs/common';
import { Company } from '../entities/company.entity';
import { User } from '../../user/entities/user.entity';
import { Account } from '../../account/entities/account.entity';
import { CompanyRepository } from '../company.repository';
import { NotFoundException } from '@nestjs/common';
import { CompanySettingsDto } from '../dto/company-settings.dto';
import { CompanySettings } from '../interfaces/company-settings.interface';
import { createDefaultCompanySettings } from '../factories/company-settings.factory';
import { deepMerge } from '../../utils/deep-merge.util';

@Injectable()
export class CompanyService {
  constructor(
    @Inject('CompanyRepository')
    private readonly companyRepository: CompanyRepository,
  ) {}

  async create(
    name: string,
    sector: string,
    owner: User,
    settings?: Record<string, any>,
    account?: Account,
  ): Promise<Company> {
    const defaultSettings = createDefaultCompanySettings();
    const finalSettings = deepMerge<Record<string, any>>(
      defaultSettings as any,
      settings || {},
    );

    const company = this.companyRepository.create({
      name,
      sector,
      owner,
      ...(account ? { account } : {}),
      settings: finalSettings,
    });

    return this.companyRepository.save(company);
  }

  async findByOwner(ownerId: string): Promise<Company | null> {
    return this.companyRepository.findByOwnerId(ownerId);
  }

  async getSettings(companyId: string): Promise<CompanySettings> {
    const company = await this.companyRepository.findById(companyId);
    if (!company) {
      throw new NotFoundException(`Company defaults to ${companyId} not found`);
    }

    const defaults = createDefaultCompanySettings();
    return deepMerge<CompanySettings>(defaults as any, company.settings);
  }

  async updateSettings(
    companyId: string,
    dto: CompanySettingsDto,
  ): Promise<CompanySettings> {
    const company = await this.companyRepository.findById(companyId);
    if (!company) {
      throw new NotFoundException(`Company ${companyId} not found`);
    }

    const currentSettings = company.settings || {};
    const updatedSettings = deepMerge<Record<string, any>>(
      currentSettings,
      dto as any,
    );

    company.settings = updatedSettings;
    await this.companyRepository.save(company);

    return this.getSettings(companyId);
  }

  resolveCompanySetting<T = any>(
    company: Company,
    keyPath: string,
    fallback?: T,
  ): T {
    const keys = keyPath.split('.');
    let current: any = company.settings;

    for (const key of keys) {
      if (current === undefined || current === null) {
        return fallback as T;
      }
      current = current[key];
    }

    return current !== undefined ? current : fallback;
  }
}
