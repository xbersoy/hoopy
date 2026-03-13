import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '@auth/auth.controller';
import { AuthService } from '@auth/auth.service';
import { RegisterDto } from '@auth/dto/auth.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
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
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'password123',
        account: {
          name: 'Test Account',
          type: 'Personal',
        },
        company: {
          name: 'Test Company',
          sector: 'Technology',
        },
      };

      const expectedResponse = {
        accessToken: 'mock-token',
        refreshToken: 'mock-token',
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
        password: 'password123',
      };

      const expectedResponse = {
        accessToken: 'mock-token',
        refreshToken: 'mock-token',
      };

      jest.spyOn(authService, 'login').mockResolvedValue(expectedResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(expectedResponse);
      expect(authService.login).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
    });
  });

  describe('refresh', () => {
    it('should refresh tokens', async () => {
      const refreshToken = 'valid-refresh-token';
      const expectedResponse = {
        accessToken: 'mock-token',
        refreshToken: 'mock-token',
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
