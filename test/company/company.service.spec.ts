import { Test, TestingModule } from '@nestjs/testing';
import { CompanyService } from '@company/services/company.service';
import { Company } from '@company/entities/company.entity';
import { User } from '@user/entities/user.entity';
import { mockCompanyRepository, createMockUser, createMockCompany } from '@test/test.utils';

describe('CompanyService', () => {
  let service: CompanyService;
  let companyRepository: jest.Mocked<any>;

  beforeEach(async () => {
    const companyRepositoryMock = {
      create: jest.fn(),
      save: jest.fn(),
      findByOwnerId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyService,
        {
          provide: 'CompanyRepository',
          useValue: companyRepositoryMock,
        }
      ]
    }).compile();

    service = module.get<CompanyService>(CompanyService);
    companyRepository = module.get('CompanyRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new company', async () => {
      const mockUser = await createMockUser();
      const mockCompany = await createMockCompany({ owner: mockUser });
      const companyData = {
        name: 'Test Company',
        sector: 'Technology',
        owner: mockUser
      };

      companyRepository.create.mockReturnValue(mockCompany);
      companyRepository.save.mockResolvedValue(mockCompany);

      const result = await service.create(companyData.name, companyData.sector, companyData.owner);

      expect(result).toEqual(mockCompany);
      expect(companyRepository.create).toHaveBeenCalledWith(companyData);
      expect(companyRepository.save).toHaveBeenCalledWith(mockCompany);
    });

    it('should handle errors during company creation', async () => {
      const mockUser = await createMockUser();
      const error = new Error('Database error');

      companyRepository.create.mockReturnValue({} as Company);
      companyRepository.save.mockRejectedValue(error);

      await expect(service.create('Test Company', 'Technology', mockUser))
        .rejects.toThrow(error);
    });
  });

  describe('findByOwner', () => {
    it('should find company by owner', async () => {
      const mockUser = await createMockUser();
      const mockCompany = await createMockCompany({ owner: mockUser });

      companyRepository.findByOwnerId.mockResolvedValue(mockCompany);

      const result = await service.findByOwner(mockUser.id);

      expect(result).toEqual(mockCompany);
      expect(companyRepository.findByOwnerId).toHaveBeenCalledWith(mockUser.id);
    });

    it('should return null if company not found', async () => {
      const mockUser = await createMockUser();

      companyRepository.findByOwnerId.mockResolvedValue(null);

      const result = await service.findByOwner(mockUser.id);

      expect(result).toBeNull();
      expect(companyRepository.findByOwnerId).toHaveBeenCalledWith(mockUser.id);
    });
  });
}); 