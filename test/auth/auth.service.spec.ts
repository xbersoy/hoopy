import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../../src/auth/auth.service';
import { User } from '../../src/user/entities/user.entity';
import { RegisterDto } from '../../src/auth/dto/auth.dto';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AccountService } from '../../src/account/services/account.service';
import { ContactService } from '../../src/contact/contact.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: any;
  let jwtService: any;
  let accountService: any;
  let contactService: any;

  beforeEach(async () => {
    const mockUserRepository = {
      create: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
    };

    const mockAccountService = {
      create: jest.fn(),
    };

    const mockContactService = {
      createContact: jest.fn(),
    };

    const mockJwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };

    const jwtConfig = {
      accessSecret: 'test-access-secret',
      refreshSecret: 'test-refresh-secret',
      accessTokenExpirationTime: '15m',
      refreshTokenExpirationTime: '7d',
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue(jwtConfig),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: AccountService,
          useValue: mockAccountService,
        },
        {
          provide: ContactService,
          useValue: mockContactService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);
    accountService = module.get(AccountService);
    contactService = module.get(ContactService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('register', () => {
    it('should register a new user with account and contacts', async () => {
      const registerDto: RegisterDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'newuser@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        account: {
          name: 'Test Account',
          type: 'Personal',
        },
      };

      const user = new User();
      user.id = '2';
      user.email = registerDto.email.trim();
      user.password = 'hashedPassword';
      user.firstName = registerDto.firstName;
      user.lastName = registerDto.lastName;

      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(user);
      userRepository.save.mockResolvedValue(user);

      accountService.create.mockResolvedValue({});
      contactService.createContact.mockResolvedValue({});

      jwtService.signAsync.mockResolvedValue('test-token');

      const result = await service.register(registerDto);

      expect(result).toEqual({
        accessToken: 'test-token',
        refreshToken: 'test-token',
      });

      expect(userRepository.create).toHaveBeenCalledWith({
        email: registerDto.email.trim(),
        password: 'hashedPassword',
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      });

      expect(userRepository.save).toHaveBeenCalledWith(user);
      expect(accountService.create).toHaveBeenCalledWith(
        registerDto.account.name,
        registerDto.account.type,
        user,
      );
      expect(contactService.createContact).toHaveBeenCalledTimes(2);
    });

    it('should throw BadRequestException if user already exists', async () => {
      const registerDto: RegisterDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        account: {
          name: 'Test Account',
          type: 'Personal',
        },
      };

      const existingUser = new User();
      userRepository.findOne.mockResolvedValue(existingUser);

      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
      expect(accountService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const user = new User();
      user.id = '1';
      user.email = email;
      user.password = 'hashedPassword';

      userRepository.findOne.mockResolvedValue(user);
      jwtService.signAsync.mockResolvedValue('test-token');

      const result = await service.login(email, password);

      expect(result).toEqual({
        accessToken: 'test-token',
        refreshToken: 'test-token',
      });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.login(email, password)).rejects.toThrow(UnauthorizedException);
    });
  });
});