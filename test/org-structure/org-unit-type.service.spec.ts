import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrgUnitTypeService } from '@org-structure/services/org-unit-type.service';
import { OrgUnitType } from '@org-structure/entities/org-unit-type.entity';
import { OrgUnitTypeI18n } from '@org-structure/entities/org-unit-type-i18n.entity';

describe('OrgUnitTypeService', () => {
  let service: OrgUnitTypeService;
  let repo: jest.Mocked<any>;
  let i18nRepo: jest.Mocked<any>;

  beforeEach(async () => {
    repo = {
      create: jest.fn(),
      save: jest.fn(),
      findByCompany: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    i18nRepo = {
      create: jest.fn(),
      save: jest.fn(),
      saveAll: jest.fn(),
      findByTypeAndLocale: jest.fn(),
      upsertForType: jest.fn(),
      deleteByTypeId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrgUnitTypeService,
        {
          provide: 'OrgUnitTypeRepository',
          useValue: repo,
        },
        {
          provide: 'OrgUnitTypeI18nRepository',
          useValue: i18nRepo,
        },
      ],
    }).compile();

    service = module.get<OrgUnitTypeService>(OrgUnitTypeService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should create type with multiple locale translations', async () => {
      const companyId = 'c1';
      const dto = {
        slug: 'department',
        translations: {
          en: { name: 'Department' },
          tr: { name: 'Departman', shortName: 'Dept' },
        },
      };

      const entity = {
        id: 'type-1',
        companyId,
        slug: 'department',
      } as OrgUnitType;
      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);
      repo.findOne.mockResolvedValue({
        ...entity,
        translations: [
          {
            locale: 'en',
            name: 'Department',
            shortName: null,
            description: null,
          },
          {
            locale: 'tr',
            name: 'Departman',
            shortName: 'Dept',
            description: null,
          },
        ],
      });
      i18nRepo.upsertForType.mockResolvedValue({} as OrgUnitTypeI18n);

      await service.create(companyId, dto);

      expect(repo.save).toHaveBeenCalled();
      expect(i18nRepo.upsertForType).toHaveBeenCalledTimes(2);
      expect(i18nRepo.upsertForType).toHaveBeenCalledWith(
        companyId,
        'type-1',
        'en',
        { name: 'Department', shortName: null, description: null },
      );
      expect(i18nRepo.upsertForType).toHaveBeenCalledWith(
        companyId,
        'type-1',
        'tr',
        { name: 'Departman', shortName: 'Dept', description: null },
      );
    });

    it('should throw BadRequestException when no translations provided', async () => {
      await expect(
        service.create('c1', { slug: 'test', translations: {} }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll with locale resolution', () => {
    const makeEntity = (
      slug: string,
      translations: Partial<OrgUnitTypeI18n>[],
    ) =>
      ({
        id: `id-${slug}`,
        companyId: 'c1',
        slug,
        color: null,
        icon: null,
        createdAt: new Date(),
        translations,
      }) as OrgUnitType;

    it('should resolve to requested locale when available', async () => {
      const entity = makeEntity('department', [
        {
          locale: 'en',
          name: 'Department',
          shortName: null,
          description: null,
        } as OrgUnitTypeI18n,
        {
          locale: 'tr',
          name: 'Departman',
          shortName: null,
          description: null,
        } as OrgUnitTypeI18n,
      ]);
      repo.findByCompany.mockResolvedValue([entity]);

      const result = await service.findAll('c1', 'tr');
      expect(result[0].name).toBe('Departman');
      expect(result[0].resolvedLocale).toBe('tr');
    });

    it('should fall back to "en" when requested locale is missing', async () => {
      const entity = makeEntity('department', [
        {
          locale: 'en',
          name: 'Department',
          shortName: null,
          description: null,
        } as OrgUnitTypeI18n,
      ]);
      repo.findByCompany.mockResolvedValue([entity]);

      const result = await service.findAll('c1', 'de');
      expect(result[0].name).toBe('Department');
      expect(result[0].resolvedLocale).toBe('en');
    });

    it('should fall back to slug when no translations exist', async () => {
      const entity = makeEntity('department', []);
      repo.findByCompany.mockResolvedValue([entity]);

      const result = await service.findAll('c1', 'en');
      expect(result[0].name).toBe('department');
      expect(result[0].resolvedLocale).toBe('slug');
    });

    it('should include all translations when includeTranslations is true', async () => {
      const entity = makeEntity('department', [
        {
          locale: 'en',
          name: 'Department',
          shortName: null,
          description: null,
        } as OrgUnitTypeI18n,
        {
          locale: 'tr',
          name: 'Departman',
          shortName: null,
          description: null,
        } as OrgUnitTypeI18n,
      ]);
      repo.findByCompany.mockResolvedValue([entity]);

      const result = await service.findAll('c1', 'en', true);
      expect(result[0].translations).toHaveLength(2);
      expect(result[0].translations[0].locale).toBe('en');
      expect(result[0].translations[1].locale).toBe('tr');
    });

    it('should NOT include translations when includeTranslations is false', async () => {
      const entity = makeEntity('department', [
        {
          locale: 'en',
          name: 'Department',
          shortName: null,
          description: null,
        } as OrgUnitTypeI18n,
      ]);
      repo.findByCompany.mockResolvedValue([entity]);

      const result = await service.findAll('c1', 'en', false);
      expect(result[0].translations).toBeUndefined();
    });
  });

  describe('findOneResolved', () => {
    it('should throw NotFoundException if not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOneResolved('bad', 'c1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should upsert translations on update', async () => {
      const entity = {
        id: '1',
        companyId: 'c1',
        slug: 'dept',
        color: null,
        icon: null,
        translations: [],
      } as unknown as OrgUnitType;

      repo.findOne.mockResolvedValue(entity);
      repo.save.mockResolvedValue(entity);
      i18nRepo.upsertForType.mockResolvedValue({} as OrgUnitTypeI18n);

      await service.update('1', 'c1', {
        translations: {
          de: { name: 'Abteilung' },
        },
      });

      expect(i18nRepo.upsertForType).toHaveBeenCalledWith('c1', '1', 'de', {
        name: 'Abteilung',
        shortName: null,
        description: null,
      });
    });
  });

  describe('remove', () => {
    it('should remove the entity (translations cascade)', async () => {
      const entity = { id: '1', companyId: 'c1' } as OrgUnitType;
      repo.findOne.mockResolvedValue(entity);
      repo.remove.mockResolvedValue(entity);

      await service.remove('1', 'c1');
      expect(repo.remove).toHaveBeenCalledWith(entity);
    });
  });
});
