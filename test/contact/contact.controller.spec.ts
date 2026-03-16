import { Test, TestingModule } from '@nestjs/testing';
import { ContactController } from '@/contact/contact.controller';
import { ContactService } from '@/contact/contact.service';
import { Contact, ContactType } from '@/contact/entities/contact.entity';
import { PermissionsService } from '@/permissions/services/permissions.service';

describe('ContactController', () => {
  let controller: ContactController;
  let contactService: jest.Mocked<any>;

  const mockContact: Contact = {
    id: 'c-1',
    type: ContactType.EMAIL,
    value: 'test@example.com',
    label: 'work',
    isPrimary: true,
    user: { id: 'user-1' } as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    contactService = {
      createContact: jest.fn(),
      getPrimaryContact: jest.fn(),
      updateContact: jest.fn(),
      deleteContact: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactController],
      providers: [
        { provide: ContactService, useValue: contactService },
        {
          provide: PermissionsService,
          useValue: { userCan: jest.fn().mockResolvedValue(true) },
        },
      ],
    }).compile();

    controller = module.get<ContactController>(ContactController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should forward all dto fields and req.user to the service', async () => {
      const req = { user: { id: 'user-1', email: 'admin@co.com' } };
      const dto = {
        type: ContactType.EMAIL,
        value: 'test@example.com',
        label: 'work',
        isPrimary: true,
      };
      contactService.createContact.mockResolvedValue(mockContact);

      const result = await controller.create(req, dto);

      expect(result).toEqual(mockContact);
      expect(contactService.createContact).toHaveBeenCalledWith(
        req.user,
        ContactType.EMAIL,
        'test@example.com',
        'work',
        true,
      );
    });
  });

  describe('getPrimaryContact', () => {
    it('should call service with userId from request and type from param', async () => {
      const req = { user: { id: 'user-1' } };
      contactService.getPrimaryContact.mockResolvedValue(mockContact);

      const result = await controller.getPrimaryContact(req, ContactType.EMAIL);

      expect(result).toEqual(mockContact);
      expect(contactService.getPrimaryContact).toHaveBeenCalledWith(
        'user-1',
        ContactType.EMAIL,
      );
    });
  });

  describe('update', () => {
    it('should call service.updateContact with contact id, userId, and update payload', async () => {
      const req = { user: { id: 'user-1' } };
      const dto = { value: 'new@example.com' };
      contactService.updateContact.mockResolvedValue({
        ...mockContact,
        ...dto,
      });

      const result = await controller.update(req, 'c-1', dto);

      expect(result.value).toBe('new@example.com');
      expect(contactService.updateContact).toHaveBeenCalledWith(
        'c-1',
        'user-1',
        dto,
      );
    });
  });

  describe('remove', () => {
    it('should call service.deleteContact with contact id and userId', async () => {
      const req = { user: { id: 'user-1' } };
      contactService.deleteContact.mockResolvedValue(undefined);

      await controller.remove(req, 'c-1');

      expect(contactService.deleteContact).toHaveBeenCalledWith(
        'c-1',
        'user-1',
      );
    });
  });
});
