import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserRepository } from './user.repository';
import { UserSettingsDto } from './dto/user-settings.dto';
import { UserSettings } from './interfaces/user-settings.interface';
import { createDefaultUserSettings } from './factories/user-settings.factory';
import { deepMerge } from '../utils/deep-merge.util';

@Injectable()
export class UserService {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const defaultSettings = createDefaultUserSettings();
    const finalSettings = deepMerge<Record<string, any>>(
      defaultSettings as any,
      (createUserDto as any).settings || {},
    );

    const user = this.userRepository.create({
      ...createUserDto,
      settings: finalSettings,
    });
    return this.userRepository.save(user);
  }

  async findAll() {
    return this.userRepository.findAll();
  }

  async findOne(id: string) {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    return this.userRepository.remove(user);
  }

  async getSettings(userId: string): Promise<UserSettings> {
    const user = await this.findOne(userId);

    const defaults = createDefaultUserSettings();
    return deepMerge<UserSettings>(defaults as any, user.settings);
  }

  async updateSettings(
    userId: string,
    dto: UserSettingsDto,
  ): Promise<UserSettings> {
    const user = await this.findOne(userId);

    const currentSettings = user.settings || {};
    const updatedSettings = deepMerge<Record<string, any>>(
      currentSettings,
      dto as any,
    );

    user.settings = updatedSettings;
    await this.userRepository.save(user);

    return this.getSettings(userId);
  }

  resolveUserSetting<T = any>(user: User, keyPath: string, fallback?: T): T {
    const keys = keyPath.split('.');
    let current: any = user.settings;

    for (const key of keys) {
      if (current === undefined || current === null) {
        return fallback as T;
      }
      current = current[key];
    }

    return current !== undefined ? current : fallback;
  }
}
