import { Test, TestingModule } from '@nestjs/testing';
import { CustomObjectRecordsService } from './custom-object-records.service';
import { CustomObjectDefinitionsService } from './custom-object-definitions.service';
import { AttachmentsService } from '../../attachments/attachments.service';
import { PicklistsService } from '../../picklists/picklists.service';
import { PermissionsService } from '../../permissions/services/permissions.service';
import { BadRequestException } from '@nestjs/common';
import { CustomFieldType } from '../enums/custom-field-type.enum';

describe('CustomObjectRecordsService', () => {
  let service: CustomObjectRecordsService;

  const mockRecordRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findPaginated: jest.fn(),
    delete: jest.fn(),
  };

  const mockDefinitionsService = {
    findOne: jest.fn(),
    findAll: jest.fn(),
  };

  const mockAttachmentsService = {
    findOne: jest.fn(),
  };

  const mockPicklistsService = {
    isValidOptionCode: jest.fn(),
  };

  const mockPermissionsService = {
    getUserPermissions: jest.fn(),
    hasPermissionByResourceType: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomObjectRecordsService,
        {
          provide: 'CustomObjectRecordRepository',
          useValue: mockRecordRepository,
        },
        {
          provide: CustomObjectDefinitionsService,
          useValue: mockDefinitionsService,
        },
        { provide: AttachmentsService, useValue: mockAttachmentsService },
        { provide: PicklistsService, useValue: mockPicklistsService },
        { provide: PermissionsService, useValue: mockPermissionsService },
      ],
    }).compile();

    service = module.get<CustomObjectRecordsService>(
      CustomObjectRecordsService,
    );
    jest.clearAllMocks();
  });

  describe('RBP Interactions', () => {
    it('should strip away fields missing read permissions', async () => {
      const data = { visibleTopSecret: '123', publicInfo: 'yes' };
      const definition = {
        code: 'TEST_OBJ',
        fields: [{ code: 'visibleTopSecret' }, { code: 'publicInfo' }],
      } as any;
      const userPermissionIds = ['perm-public'];

      // visibleTopSecret: user does not have read permission
      mockPermissionsService.hasPermissionByResourceType.mockImplementation(
        async (_ids: string[], action: string, resourceType: string) => {
          if (
            resourceType === 'co:TEST_OBJ:visibleTopSecret' &&
            action === 'read'
          )
            return false;
          return true;
        },
      );

      const record = { data } as any;
      const result = await (service as any).filterReadFields(
        record,
        definition,
        userPermissionIds,
      );
      expect(result.data).toHaveProperty('publicInfo');
      expect(result.data).not.toHaveProperty('visibleTopSecret');
    });

    it('should allow fields when user has read permission', async () => {
      const data = { visibleTopSecret: '123', publicInfo: 'yes' };
      const definition = {
        code: 'TEST_OBJ',
        fields: [{ code: 'visibleTopSecret' }],
      } as any;
      const userPermissionIds = ['perm-read-all'];

      mockPermissionsService.hasPermissionByResourceType.mockResolvedValue(
        true,
      );

      const record = { data } as any;
      const result = await (service as any).filterReadFields(
        record,
        definition,
        userPermissionIds,
      );
      expect(result.data).toHaveProperty('visibleTopSecret');
    });

    it('should throw BadRequestException if writing to edit-restricted field without permission', async () => {
      const payloadData = { secretEdit: 'hack' };
      const definition = {
        code: 'TEST_OBJ',
        fields: [{ code: 'secretEdit' }],
      } as any;
      const userPermissionIds = ['basic-perm'];

      mockPermissionsService.hasPermissionByResourceType.mockResolvedValue(
        false,
      );

      await expect(
        (service as any).enforceEditPermissions(
          payloadData,
          definition,
          userPermissionIds,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should NOT throw if writing to edit-restricted field WITH correct permission', async () => {
      const payloadData = { secretEdit: 'hack', anotherField: 'ok' };
      const definition = {
        code: 'TEST_OBJ',
        fields: [{ code: 'secretEdit' }, { code: 'anotherField' }],
      } as any;
      const userPermissionIds = ['edit-perm'];

      mockPermissionsService.hasPermissionByResourceType.mockResolvedValue(
        true,
      );

      await expect(
        (service as any).enforceEditPermissions(
          payloadData,
          definition,
          userPermissionIds,
        ),
      ).resolves.not.toThrow();
    });
  });

  describe('Data Validations', () => {
    it('should validate ATTACHMENT type by hitting AttachmentsService', async () => {
      const companyId = 'co1';
      const fields: any[] = [
        {
          code: 'file',
          dataType: CustomFieldType.ATTACHMENT,
          isRequired: true,
        },
      ];
      const data = { file: 'attachment-uuid-xyz' };

      // Mock the attachment being found
      mockAttachmentsService.findOne.mockResolvedValueOnce({
        id: 'attachment-uuid-xyz',
      });

      await expect(
        (service as any).validateData(data, fields, companyId),
      ).resolves.not.toThrow();
      expect(mockAttachmentsService.findOne).toHaveBeenCalledWith(
        'attachment-uuid-xyz',
      );
    });

    it('should throw if ATTACHMENT is missing (isRequired)', async () => {
      const companyId = 'co1';
      const fields: any[] = [
        {
          code: 'file',
          dataType: CustomFieldType.ATTACHMENT,
          isRequired: true,
        },
      ];
      const data = { other: '123' };

      await expect(
        (service as any).validateData(data, fields, companyId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate PICKLIST type by hitting PicklistsService', async () => {
      const companyId = 'co1';
      const fields: any[] = [
        {
          code: 'status',
          dataType: CustomFieldType.PICKLIST,
          picklistId: 'p-uuid',
          isRequired: true,
        },
      ];
      const data = { status: 'INVALID_OPTION' };

      mockPicklistsService.isValidOptionCode.mockResolvedValueOnce(false);

      await expect(
        (service as any).validateData(data, fields, companyId),
      ).rejects.toThrow(
        'Field "status" contains an invalid picklist option code',
      );
      expect(mockPicklistsService.isValidOptionCode).toHaveBeenCalledWith(
        'p-uuid',
        companyId,
        'INVALID_OPTION',
      );
    });

    it('should validate CUSTOM_OBJECT linking', async () => {
      const companyId = 'co1';
      const fields: any[] = [
        {
          code: 'assetRef',
          dataType: CustomFieldType.CUSTOM_OBJECT,
          referencedDefinitionId: 'def2',
        },
      ];
      const data = { assetRef: 'rec-uuid' };

      // Mock finding the custom object definition but failing the record check mapping (e.g. valid DB hit vs failing mock)
      mockRecordRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        (service as any).validateData(data, fields, companyId),
      ).rejects.toThrow(BadRequestException);
      expect(mockRecordRepository.findOne).toHaveBeenCalledWith('rec-uuid');
    });

    it('should validate STRING_ARRAY type accepts valid string arrays', async () => {
      const companyId = 'co1';
      const fields: any[] = [
        {
          code: 'tags',
          dataType: CustomFieldType.STRING_ARRAY,
          isRequired: true,
        },
      ];
      const data = { tags: ['tag1', 'tag2', 'tag3'] };

      await expect(
        (service as any).validateData(data, fields, companyId),
      ).resolves.not.toThrow();
    });

    it('should reject STRING_ARRAY when value is not an array', async () => {
      const companyId = 'co1';
      const fields: any[] = [
        {
          code: 'tags',
          dataType: CustomFieldType.STRING_ARRAY,
          isRequired: true,
        },
      ];
      const data = { tags: 'not-an-array' };

      await expect(
        (service as any).validateData(data, fields, companyId),
      ).rejects.toThrow('Field "tags" must be an array of strings');
    });

    it('should reject STRING_ARRAY with non-string elements', async () => {
      const companyId = 'co1';
      const fields: any[] = [
        {
          code: 'tags',
          dataType: CustomFieldType.STRING_ARRAY,
          isRequired: false,
        },
      ];
      const data = { tags: ['valid', 123, 'mixed'] };

      await expect(
        (service as any).validateData(data, fields, companyId),
      ).rejects.toThrow('Field "tags" must be an array of strings');
    });

    it('should validate NUMBER_ARRAY type accepts valid number arrays', async () => {
      const companyId = 'co1';
      const fields: any[] = [
        {
          code: 'scores',
          dataType: CustomFieldType.NUMBER_ARRAY,
          isRequired: true,
        },
      ];
      const data = { scores: [10, 20, 30.5] };

      await expect(
        (service as any).validateData(data, fields, companyId),
      ).resolves.not.toThrow();
    });

    it('should reject NUMBER_ARRAY when value is not an array', async () => {
      const companyId = 'co1';
      const fields: any[] = [
        {
          code: 'scores',
          dataType: CustomFieldType.NUMBER_ARRAY,
          isRequired: true,
        },
      ];
      const data = { scores: 42 };

      await expect(
        (service as any).validateData(data, fields, companyId),
      ).rejects.toThrow('Field "scores" must be an array of numbers');
    });

    it('should reject NUMBER_ARRAY with non-number elements', async () => {
      const companyId = 'co1';
      const fields: any[] = [
        {
          code: 'scores',
          dataType: CustomFieldType.NUMBER_ARRAY,
          isRequired: false,
        },
      ];
      const data = { scores: [1, '2', 3] };

      await expect(
        (service as any).validateData(data, fields, companyId),
      ).rejects.toThrow('Field "scores" must be an array of numbers');
    });
  });
});
