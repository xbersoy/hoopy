import { Test, TestingModule } from '@nestjs/testing';
import { CompanyService } from './company.service';
import { NotFoundException } from '@nestjs/common';
import { createDefaultCompanySettings } from '../factories/company-settings.factory';

describe('CompanyService', () => {
  let service: CompanyService;
  let repository: any;

  beforeEach(async () => {
    repository = {
      findById: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      findByOwnerId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyService,
        {
          provide: 'CompanyRepository',
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<CompanyService>(CompanyService);
  });

  describe('getSettings', () => {
    it('throws NotFoundException if company does not exist', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.getSettings('1')).rejects.toThrow(NotFoundException);
    });

    it('returns default settings if company has no settings', async () => {
      repository.findById.mockResolvedValue({ id: '1', settings: null });
      const result = await service.getSettings('1');
      expect(result).toEqual(createDefaultCompanySettings());
    });

    it('merges default settings with existing valid settings', async () => {
      repository.findById.mockResolvedValue({
        id: '1',
        settings: {
          localization: {
            timezone: 'America/New_York',
          },
        },
      });

      const result = await service.getSettings('1');
      expect(result.localization.timezone).toBe('America/New_York');
      expect(result.localization.defaultLanguage).toBe('en'); // from defaults
    });
  });

  describe('updateSettings', () => {
    it('throws NotFoundException if company does not exist', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.updateSettings('1', {} as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deep merges updates with existing settings and saves without dropping legacy keys', async () => {
      const existingSettings: any = {
        legacyFeature: true,
        localization: {
          timezone: 'Europe/Istanbul',
          dateFormat: 'DD/MM/YYYY',
        },
      };

      const company = { id: '1', settings: existingSettings };
      repository.findById.mockResolvedValue(company);
      repository.save.mockResolvedValue(company);

      const updates = {
        localization: {
          timezone: 'UTC',
        },
        ui: {
          theme: 'dark',
        },
      };

      const result = await service.updateSettings('1', updates as any);

      expect(repository.save).toHaveBeenCalled();
      expect(company.settings.localization.timezone).toBe('UTC');
      expect(company.settings.localization.dateFormat).toBe('DD/MM/YYYY');
      expect(company.settings.ui.theme).toBe('dark');
      expect(company.settings.legacyFeature).toBe(true);
      expect(result).toBeDefined();
    });
  });
});
