import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from '@auth/strategies/jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { User } from '@user/entities/user.entity';
import { mockConfigService, mockUserRepository } from '@test/test.utils';
import { JWT_CONFIG } from '@infras/configuration/configuration.consts';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: ConfigService;
  let userRepository: jest.Mocked<any>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key) => {
              if (key === JWT_CONFIG) {
                return {
                  accessSecret: 'test-secret',
                  refreshSecret: 'test-refresh-secret',
                  accessExpiresIn: '1h',
                  refreshExpiresIn: '7d'
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
              if (options?.where?.id === '1') {
                const user = new User();
                user.id = '1';
                user.email = 'test@example.com';
                return Promise.resolve(user);
              }
              return Promise.resolve(null);
            })
          }
        }
      ]
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    configService = module.get<ConfigService>(ConfigService);
    userRepository = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return user if found', async () => {
      const payload = { sub: '1', email: 'test@example.com' };
      const result = await strategy.validate(payload);

      expect(result).toBeDefined();
      expect(result.id).toBe('1');
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: payload.sub }
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const payload = { sub: '2', email: 'test@example.com' };

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: payload.sub }
      });
    });
  });
}); 