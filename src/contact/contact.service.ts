import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Contact, ContactType } from './entities/contact.entity';
import { User } from '../user/entities/user.entity';
import { ContactRepository } from './contact.repository';

@Injectable()
export class ContactService {
  constructor(
    @Inject('ContactRepository')
    private readonly contactRepository: ContactRepository,
  ) {}

  async createContact(user: User, type: ContactType, value: string, label?: string, isPrimary: boolean = false): Promise<Contact> {
    if (isPrimary) {
      // If this is primary, unset any existing primary contact of the same type
      await this.contactRepository.unsetPrimaryForType(user.id, type);
    }

    const contact = this.contactRepository.create({
      type,
      value,
      label,
      isPrimary,
      user,
    });

    return this.contactRepository.save(contact);
  }

  async getPrimaryContact(userId: string, type: ContactType): Promise<Contact | null> {
    return this.contactRepository.findPrimary(userId, type);
  }

  async updateContact(id: string, userId: string, updates: Partial<Contact>): Promise<Contact> {
    const contact = await this.contactRepository.findByIdForUser(id, userId);

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    if (updates.isPrimary && updates.isPrimary !== contact.isPrimary) {
      // If setting as primary, unset any existing primary contact of the same type
      await this.contactRepository.unsetPrimaryForType(userId, contact.type);
    }

    Object.assign(contact, updates);
    return this.contactRepository.save(contact);
  }

  async deleteContact(id: string, userId: string): Promise<void> {
    const affected = await this.contactRepository.deleteForUser(id, userId);
    if (affected === 0) {
      throw new NotFoundException('Contact not found');
    }
  }
} 