import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '@auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { RegisterDto } from '@auth/dto/auth.dto';
import { User } from '@user/entities/user.entity';
import { Company } from '@company/entities/company.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  mockJwtService,
  mockConfigService,
  mockUserRepository,
  mockCompanyRepository,
  mockDataSource,
  createMockUser,
  createMockCompany,
} from '@test/test.utils';
import { JWT_CONFIG } from '@infras/configuration/configuration.consts';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true)
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<any>;
  let companyRepository: jest.Mocked<any>;
  let dataSource: jest.Mocked<any>;
  let queryRunner: any;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        save: jest.fn().mockImplementation((entity) => {
          if (entity instanceof User) {
            const user = new User();
            user.id = '1';
            user.email = entity.email;
            user.password = entity.password;
            return Promise.resolve(user);
          }
          if (entity instanceof Company) {
            const company = new Company();
            company.id = '1';
            company.name = entity.name;
            company.sector = entity.sector;
            company.owner = entity.owner;
            return Promise.resolve(company);
          }
          return Promise.resolve(entity);
        }),
        findOne: jest.fn().mockImplementation((entity, options) => {
          if (entity === User && options?.where?.email === 'test@example.com') {
            return Promise.resolve(null);
          }
          return Promise.resolve(null);
        })
      }
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            ...mockJwtService,
            verifyAsync: jest.fn().mockImplementation((token) => {
              if (token === 'valid-refresh-token') {
                return Promise.resolve({ sub: '1', email: 'test@example.com' });
              }
              return Promise.reject(new Error('Invalid token'));
            }),
            signAsync: jest.fn().mockImplementation((payload, options) => {
              if (options?.secret === 'test-secret') {
                return Promise.resolve('new-access-token');
              }
              return Promise.resolve('new-refresh-token');
            })
          }
        },
        {
          provide: ConfigService,
          useValue: {
            ...mockConfigService,
            get: jest.fn().mockImplementation((key) => {
              if (key === JWT_CONFIG) {
                return {
                  accessSecret: 'test-secret',
                  refreshSecret: 'test-refresh-secret',
                  accessTokenExpirationTime: '1h',
                  refreshTokenExpirationTime: '7d'
                };
              }
              return null;
            })
          }
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            ...mockUserRepository,
            findOne: jest.fn().mockImplementation((options) => {
              if (options?.where?.email === 'test@example.com' || options?.where?.id === '1') {
                const user = new User();
                user.id = '1';
                user.email = 'test@example.com';
                user.password = 'hashedPassword';
                user.refreshToken = 'valid-refresh-token';
                return Promise.resolve(user);
              }
              return Promise.resolve(null);
            }),
            update: jest.fn().mockResolvedValue({ affected: 1 })
          }
        },
        {
          provide: getRepositoryToken(Company),
          useValue: mockCompanyRepository
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(queryRunner)
          }
        }
      ]
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    companyRepository = module.get(getRepositoryToken(Company));
    dataSource = module.get(DataSource);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user and create a company', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        company: {
          name: 'Test Company',
          sector: 'Technology'
        }
      };

      const mockUser = await createMockUser();
      const mockCompany = await createMockCompany({ owner: mockUser });

      userRepository.findOne.mockResolvedValue(null);
      queryRunner.manager.save.mockImplementation((entity) => {
        if (entity instanceof User) return Promise.resolve(mockUser);
        if (entity instanceof Company) return Promise.resolve(mockCompany);
        return Promise.resolve(entity);
      });

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(queryRunner.manager.save).toHaveBeenCalledTimes(2);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should throw BadRequestException if user already exists', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        company: {
          name: 'Test Company',
          sector: 'Technology'
        }
      };

      const mockUser = await createMockUser();
      queryRunner.manager.findOne.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should handle transaction rollback on error', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        company: {
          name: 'Test Company',
          sector: 'Technology'
        }
      };

      userRepository.findOne.mockResolvedValue(null);
      queryRunner.manager.save.mockRejectedValue(new Error('Database error'));

      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockUser = await createMockUser();
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.login(loginDto.email, loginDto.password);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException with invalid password', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const mockUser = await createMockUser();
      userRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(false);

      await expect(service.login(loginDto.email, loginDto.password))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should successfully refresh tokens', async () => {
      const result = await service.refresh('valid-refresh-token');

      expect(result).toHaveProperty('accessToken', 'new-access-token');
      expect(result).toHaveProperty('refreshToken', 'new-refresh-token');
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-refresh-token', {
        secret: 'test-refresh-secret'
      });
      expect(userRepository.update).toHaveBeenCalledWith('1', { refreshToken: 'new-refresh-token' });
    });

    it('should throw UnauthorizedException with invalid refresh token', async () => {
      await expect(service.refresh('invalid-refresh-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user refresh token does not match', async () => {
      userRepository.findOne.mockResolvedValueOnce({
        id: '1',
        email: 'test@example.com',
        refreshToken: 'different-token'
      });

      await expect(service.refresh('valid-refresh-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      const userId = '1';
      userRepository.update.mockResolvedValue({ affected: 1 });

      await service.logout(userId);

      expect(userRepository.update).toHaveBeenCalledWith(userId, { refreshToken: null });
    });

    it('should throw BadRequestException with invalid userId', async () => {
      await expect(service.logout('')).rejects.toThrow(BadRequestException);
    });
  });
}); 