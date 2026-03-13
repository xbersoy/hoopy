import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ContactService } from '@/contact/contact.service';
import { Contact, ContactType } from '@/contact/entities/contact.entity';
import { User } from '@user/entities/user.entity';

describe('ContactService', () => {
  let service: ContactService;
  let contactRepository: jest.Mocked<any>;

  beforeEach(async () => {
    contactRepository = {
      create: jest
        .fn()
        .mockImplementation((data) => ({ id: 'new-contact', ...data })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      findPrimary: jest.fn().mockResolvedValue(null),
      findByIdForUser: jest.fn().mockResolvedValue(null),
      unsetPrimaryForType: jest.fn().mockResolvedValue(undefined),
      deleteForUser: jest.fn().mockResolvedValue(1),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactService,
        { provide: 'ContactRepository', useValue: contactRepository },
      ],
    }).compile();

    service = module.get<ContactService>(ContactService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── createContact ─────────────────────────────────────────

  describe('createContact', () => {
    const mockUser = { id: 'user-1' } as User;

    it('should create a non-primary contact without unsetting others', async () => {
      await service.createContact(
        mockUser,
        ContactType.EMAIL,
        'test@example.com',
        'work',
        false,
      );

      expect(contactRepository.unsetPrimaryForType).not.toHaveBeenCalled();
      expect(contactRepository.create).toHaveBeenCalledWith({
        type: ContactType.EMAIL,
        value: 'test@example.com',
        label: 'work',
        isPrimary: false,
        user: mockUser,
      });
      expect(contactRepository.save).toHaveBeenCalled();
    });

    it('should unset existing primaries when creating a primary contact', async () => {
      await service.createContact(
        mockUser,
        ContactType.PHONE,
        '+1234567890',
        undefined,
        true,
      );

      expect(contactRepository.unsetPrimaryForType).toHaveBeenCalledWith(
        'user-1',
        ContactType.PHONE,
      );
      expect(contactRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ isPrimary: true }),
      );
    });

    it('should default isPrimary to false when omitted', async () => {
      await service.createContact(mockUser, ContactType.EMAIL, 'a@b.com');

      expect(contactRepository.unsetPrimaryForType).not.toHaveBeenCalled();
      expect(contactRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ isPrimary: false }),
      );
    });

    it('should pass the full user object to the repository', async () => {
      const fullUser = { id: 'user-1', email: 'admin@co.com' } as User;
      await service.createContact(fullUser, ContactType.EMAIL, 'x@y.com');

      expect(contactRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ user: fullUser }),
      );
    });
  });

  // ── getPrimaryContact ─────────────────────────────────────

  describe('getPrimaryContact', () => {
    it('should delegate to repository.findPrimary', async () => {
      const expected = {
        id: '1',
        type: ContactType.EMAIL,
        isPrimary: true,
      } as Contact;
      contactRepository.findPrimary.mockResolvedValue(expected);

      const result = await service.getPrimaryContact(
        'user-1',
        ContactType.EMAIL,
      );

      expect(result).toEqual(expected);
      expect(contactRepository.findPrimary).toHaveBeenCalledWith(
        'user-1',
        ContactType.EMAIL,
      );
    });

    it('should return null when no primary exists', async () => {
      const result = await service.getPrimaryContact(
        'user-1',
        ContactType.PHONE,
      );
      expect(result).toBeNull();
    });
  });

  // ── updateContact ─────────────────────────────────────────

  describe('updateContact', () => {
    const existingContact = {
      id: 'c-1',
      type: ContactType.EMAIL,
      value: 'old@example.com',
      isPrimary: false,
    } as Contact;

    it('should update contact fields and save', async () => {
      contactRepository.findByIdForUser.mockResolvedValue({
        ...existingContact,
      });

      const result = await service.updateContact('c-1', 'user-1', {
        value: 'new@example.com',
      });

      expect(result.value).toBe('new@example.com');
      expect(contactRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when contact not found', async () => {
      await expect(
        service.updateContact('non-existent', 'user-1', { value: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should unset other primaries when promoting to primary', async () => {
      contactRepository.findByIdForUser.mockResolvedValue({
        ...existingContact,
      });

      await service.updateContact('c-1', 'user-1', { isPrimary: true });

      expect(contactRepository.unsetPrimaryForType).toHaveBeenCalledWith(
        'user-1',
        ContactType.EMAIL,
      );
    });

    it('should NOT unset primaries when isPrimary is unchanged (already primary)', async () => {
      const primaryContact = { ...existingContact, isPrimary: true };
      contactRepository.findByIdForUser.mockResolvedValue(primaryContact);

      await service.updateContact('c-1', 'user-1', { isPrimary: true });

      expect(contactRepository.unsetPrimaryForType).not.toHaveBeenCalled();
    });

    it('should NOT unset primaries when isPrimary is not in the update payload', async () => {
      contactRepository.findByIdForUser.mockResolvedValue({
        ...existingContact,
      });

      await service.updateContact('c-1', 'user-1', { label: 'personal' });

      expect(contactRepository.unsetPrimaryForType).not.toHaveBeenCalled();
    });
  });

  // ── deleteContact ─────────────────────────────────────────

  describe('deleteContact', () => {
    it('should delete contact and resolve when affected > 0', async () => {
      contactRepository.deleteForUser.mockResolvedValue(1);

      await expect(
        service.deleteContact('c-1', 'user-1'),
      ).resolves.toBeUndefined();
      expect(contactRepository.deleteForUser).toHaveBeenCalledWith(
        'c-1',
        'user-1',
      );
    });

    it('should throw NotFoundException when no rows affected', async () => {
      contactRepository.deleteForUser.mockResolvedValue(0);

      await expect(
        service.deleteContact('non-existent', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
