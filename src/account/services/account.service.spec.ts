import { Test, TestingModule } from '@nestjs/testing';
import { AccountService } from './account.service';
import { createMockAccount, createMockUser, mockAccountRepository } from '../../../test/test.utils';

describe('AccountService', () => {
  let service: AccountService;
  let accountRepository: any;

  beforeEach(async () => {
    const accountRepositoryMock = {
      create: jest.fn(),
      save: jest.fn(),
      findByOwnerId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        {
          provide: 'AccountRepository',
          useValue: accountRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<AccountService>(AccountService);
    accountRepository = module.get('AccountRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an account', async () => {
      const mockUser = await createMockUser();
      const mockAccount = {
        name: 'Test Account',
        type: 'Personal',
        owner: mockUser,
      };

      accountRepository.create.mockReturnValue(mockAccount);
      accountRepository.save.mockResolvedValue({ id: '1', ...mockAccount });

      const result = await service.create(
        mockAccount.name,
        mockAccount.type,
        mockUser,
      );

      expect(result).toEqual({ id: '1', ...mockAccount });
      expect(accountRepository.create).toHaveBeenCalledWith(mockAccount);
      expect(accountRepository.save).toHaveBeenCalledWith(mockAccount);
    });
  });

  describe('findByOwner', () => {
    it('should find account by owner', async () => {
      const mockUser = await createMockUser();
      const mockAccount = await createMockAccount({ owner: mockUser });

      accountRepository.findByOwnerId.mockResolvedValue(mockAccount);

      const result = await service.findByOwner(mockUser.id);

      expect(result).toEqual(mockAccount);
      expect(accountRepository.findByOwnerId).toHaveBeenCalledWith(mockUser.id);
    });

    it('should return null if account not found', async () => {
      const mockUser = await createMockUser();

      accountRepository.findByOwnerId.mockResolvedValue(null);

      const result = await service.findByOwner(mockUser.id);

      expect(result).toBeNull();
      expect(accountRepository.findByOwnerId).toHaveBeenCalledWith(mockUser.id);
    });
  });
}); 