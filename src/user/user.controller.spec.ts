import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { PermissionsService } from '../permissions/services/permissions.service';

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<any>;

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
    userService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      getSettings: jest.fn(),
      updateSettings: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: PermissionsService, useValue: { userCan: jest.fn().mockResolvedValue(true) } },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create and return the created user', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };
      userService.create.mockResolvedValue(mockUser);

      const result = await controller.create(dto as any);

      expect(result).toEqual(mockUser);
      expect(userService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      userService.findAll.mockResolvedValue([mockUser]);

      const result = await controller.findAll();

      expect(result).toEqual([mockUser]);
    });
  });

  describe('findOne', () => {
    it('should return user by id', async () => {
      userService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne('user-1');

      expect(result).toEqual(mockUser);
      expect(userService.findOne).toHaveBeenCalledWith('user-1');
    });
  });

  describe('update', () => {
    it('should call service.update with id and dto', async () => {
      const dto = { email: 'new@example.com' };
      userService.update.mockResolvedValue({ ...mockUser, ...dto });

      const result = await controller.update('user-1', dto as any);

      expect(userService.update).toHaveBeenCalledWith('user-1', dto);
      expect(result.email).toBe('new@example.com');
    });
  });

  describe('remove', () => {
    it('should call service.remove and return the removed user', async () => {
      userService.remove.mockResolvedValue(mockUser);

      const result = await controller.remove('user-1');

      expect(result).toEqual(mockUser);
      expect(userService.remove).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getPreferences', () => {
    it('should call service.getSettings with the user id', async () => {
      const settings = { localization: { timezone: 'UTC' } };
      userService.getSettings.mockResolvedValue(settings);

      const result = await controller.getPreferences('user-1');

      expect(result).toEqual(settings);
      expect(userService.getSettings).toHaveBeenCalledWith('user-1');
    });
  });

  describe('updatePreferences', () => {
    it('should call service.updateSettings and return merged result', async () => {
      const dto = { localization: { timezone: 'Europe/Istanbul' } };
      const updatedSettings = {
        localization: { timezone: 'Europe/Istanbul', defaultLanguage: 'en' },
      };
      userService.updateSettings.mockResolvedValue(updatedSettings);

      const result = await controller.updatePreferences('user-1', dto as any);

      expect(result).toEqual(updatedSettings);
      expect(userService.updateSettings).toHaveBeenCalledWith('user-1', dto);
    });
  });
});
