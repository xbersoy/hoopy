import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '@auth/auth.controller';
import { AuthService } from '@auth/auth.service';
import { RegisterDto } from '@auth/dto/auth.dto';
import { User } from '@user/entities/user.entity';
import { Company } from '@company/entities/company.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import {
  mockJwtService,
  mockConfigService,
  mockUserRepository,
  mockCompanyRepository,
  mockDataSource,
} from '@test/test.utils';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository
        },
        {
          provide: getRepositoryToken(Company),
          useValue: mockCompanyRepository
        },
        {
          provide: JwtService,
          useValue: mockJwtService
        },
        {
          provide: ConfigService,
          useValue: mockConfigService
        },
        {
          provide: DataSource,
          useValue: mockDataSource
        }
      ]
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user and return tokens', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        company: {
          name: 'Test Company',
          sector: 'Technology'
        }
      };

      const expectedResponse = {
        accessToken: 'mock-token',
        refreshToken: 'mock-token'
      };

      jest.spyOn(authService, 'register').mockResolvedValue(expectedResponse);

      const result = await controller.register(registerDto);

      expect(result).toEqual(expectedResponse);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('should login user and return tokens', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123'
      };

      const expectedResponse = {
        accessToken: 'mock-token',
        refreshToken: 'mock-token'
      };

      jest.spyOn(authService, 'login').mockResolvedValue(expectedResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(expectedResponse);
      expect(authService.login).toHaveBeenCalledWith(loginDto.email, loginDto.password);
    });
  });

  describe('refresh', () => {
    it('should refresh tokens', async () => {
      const refreshToken = 'valid-refresh-token';
      const expectedResponse = {
        accessToken: 'mock-token',
        refreshToken: 'mock-token'
      };

      jest.spyOn(authService, 'refresh').mockResolvedValue(expectedResponse);

      const result = await controller.refresh({ refreshToken });

      expect(result).toEqual(expectedResponse);
      expect(authService.refresh).toHaveBeenCalledWith(refreshToken);
    });
  });

  describe('logout', () => {
    it('should logout user', async () => {
      const userId = '1';
      jest.spyOn(authService, 'logout').mockResolvedValue(undefined);

      await controller.logout(userId);

      expect(authService.logout).toHaveBeenCalledWith(userId);
    });
  });
}); 