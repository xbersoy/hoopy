import { Inject, Injectable } from '@nestjs/common';
import { Account } from '../entities/account.entity';
import { User } from '../../user/entities/user.entity';
import { AccountRepository } from '../account.repository';
import { NotFoundException } from '@nestjs/common';
import { AccountSettingsDto } from '../dto/account-settings.dto';
import { AccountSettings } from '../interfaces/account-settings.interface';
import { createDefaultAccountSettings } from '../factories/account-settings.factory';
import { deepMerge } from '../../utils/deep-merge.util';

@Injectable()
export class AccountService {
  constructor(
    @Inject('AccountRepository')
    private readonly accountRepository: AccountRepository,
  ) {}

  async create(
    name: string,
    type: string,
    owner: User,
    settings?: Record<string, any>,
  ): Promise<Account> {
    const defaultSettings = createDefaultAccountSettings();
    const finalSettings = deepMerge<Record<string, any>>(
      defaultSettings as any,
      settings || {},
    );

    const account = this.accountRepository.create({
      name,
      type,
      owner,
      settings: finalSettings,
    });

    return this.accountRepository.save(account);
  }

  async findByOwner(ownerId: string): Promise<Account | null> {
    return this.accountRepository.findByOwnerId(ownerId);
  }

  async getSettings(accountId: string): Promise<AccountSettings> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      throw new NotFoundException(`Account ${accountId} not found`);
    }

    const defaults = createDefaultAccountSettings();
    return deepMerge<AccountSettings>(defaults as any, account.settings);
  }

  async updateSettings(
    accountId: string,
    dto: AccountSettingsDto,
  ): Promise<AccountSettings> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      throw new NotFoundException(`Account ${accountId} not found`);
    }

    const currentSettings = account.settings || {};
    const updatedSettings = deepMerge<Record<string, any>>(
      currentSettings,
      dto as any,
    );

    account.settings = updatedSettings;
    await this.accountRepository.save(account);

    return this.getSettings(accountId);
  }

  resolveAccountSetting<T = any>(
    account: Account,
    keyPath: string,
    fallback?: T,
  ): T {
    const keys = keyPath.split('.');
    let current: any = account.settings;

    for (const key of keys) {
      if (current === undefined || current === null) {
        return fallback as T;
      }
      current = current[key];
    }

    return current !== undefined ? current : fallback;
  }
}
