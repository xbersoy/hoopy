import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { createDefaultUserSettings } from './factories/user-settings.factory';

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<any>;

  const mockUser: User = {
    id: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'hashedPassword',
    settings: {},
    contacts: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  beforeEach(async () => {
    userRepository = {
      create: jest.fn().mockImplementation((data) => ({ ...data })),
      save: jest
        .fn()
        .mockImplementation((entity) =>
          Promise.resolve({ id: entity.id || 'user-new', ...entity }),
        ),
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue(null),
      remove: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: 'UserRepository', useValue: userRepository },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── create ────────────────────────────────────────────────

  describe('create', () => {
    it('should create a user with default settings merged in', async () => {
      const dto = { email: 'jane@example.com', password: 'password123' };

      const result = await service.create(dto);

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: dto.email,
          password: dto.password,
          settings: expect.objectContaining({
            localization: expect.any(Object),
            currency: expect.any(Object),
          }),
        }),
      );
      expect(userRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should merge provided settings with defaults', async () => {
      const dto = {
        email: 'jane@example.com',
        password: 'password123',
        settings: { localization: { timezone: 'Europe/Istanbul' } },
      } as any;

      await service.create(dto);

      const createArg = userRepository.create.mock.calls[0][0];
      expect(createArg.settings.localization.timezone).toBe('Europe/Istanbul');
      expect(createArg.settings.localization.defaultLanguage).toBe('en');
    });
  });

  // ── findAll ───────────────────────────────────────────────

  describe('findAll', () => {
    it('should return all users', async () => {
      userRepository.findAll.mockResolvedValue([mockUser]);

      const result = await service.findAll();

      expect(result).toEqual([mockUser]);
      expect(userRepository.findAll).toHaveBeenCalled();
    });

    it('should return empty array when no users exist', async () => {
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  // ── findOne ───────────────────────────────────────────────

  describe('findOne', () => {
    it('should return user by id', async () => {
      userRepository.findById.mockResolvedValue(mockUser);

      const result = await service.findOne('user-1');
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      await expect(service.findOne('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── update ────────────────────────────────────────────────

  describe('update', () => {
    it('should update user fields and save', async () => {
      userRepository.findById.mockResolvedValue({ ...mockUser });

      await service.update('user-1', { email: 'new@example.com' } as any);

      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'new@example.com' }),
      );
    });

    it('should throw NotFoundException for non-existent user', async () => {
      await expect(service.update('bad-id', {} as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── remove ────────────────────────────────────────────────

  describe('remove', () => {
    it('should remove user and return the removed entity', async () => {
      userRepository.findById.mockResolvedValue(mockUser);

      const result = await service.remove('user-1');

      expect(userRepository.remove).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ── getSettings ───────────────────────────────────────────

  describe('getSettings', () => {
    it('should merge user settings with defaults', async () => {
      userRepository.findById.mockResolvedValue({
        ...mockUser,
        settings: { localization: { timezone: 'America/New_York' } },
      });

      const result = await service.getSettings('user-1');

      expect(result.localization.timezone).toBe('America/New_York');
      expect(result.localization.defaultLanguage).toBe('en');
      expect(result.currency).toBeDefined();
    });

    it('should return defaults when user has no settings', async () => {
      userRepository.findById.mockResolvedValue({
        ...mockUser,
        settings: null,
      });

      const result = await service.getSettings('user-1');
      expect(result).toEqual(createDefaultUserSettings());
    });
  });

  // ── updateSettings ────────────────────────────────────────

  describe('updateSettings', () => {
    it('should deep merge new settings with existing and save', async () => {
      userRepository.findById.mockResolvedValue({
        ...mockUser,
        settings: { localization: { timezone: 'UTC', defaultLanguage: 'en' } },
      });

      await service.updateSettings('user-1', {
        localization: { timezone: 'Europe/Istanbul' },
      } as any);

      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({
            localization: expect.objectContaining({
              timezone: 'Europe/Istanbul',
              defaultLanguage: 'en',
            }),
          }),
        }),
      );
    });
  });

  // ── resolveUserSetting ────────────────────────────────────

  describe('resolveUserSetting', () => {
    it('should resolve a nested setting value by dot-separated key path', () => {
      const user = {
        ...mockUser,
        settings: { localization: { timezone: 'UTC' } },
      } as User;

      expect(service.resolveUserSetting(user, 'localization.timezone')).toBe(
        'UTC',
      );
    });

    it('should return fallback for a missing path', () => {
      const user = { ...mockUser, settings: {} } as User;

      expect(service.resolveUserSetting(user, 'missing.path', 'default')).toBe(
        'default',
      );
    });

    it('should return fallback when settings is null', () => {
      const user = { ...mockUser, settings: null } as User;

      expect(service.resolveUserSetting(user, 'any.path', 'fallback')).toBe(
        'fallback',
      );
    });
  });
});
