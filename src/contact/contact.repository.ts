import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact, ContactType } from './entities/contact.entity';
import { User } from '../user/entities/user.entity';

export interface ContactRepository {
  unsetPrimaryForType(userId: string, type: ContactType): Promise<void>;
  create(data: Partial<Contact>): Contact;
  save(contact: Contact): Promise<Contact>;
  findPrimary(userId: string, type: ContactType): Promise<Contact | null>;
  findByIdForUser(id: string, userId: string): Promise<Contact | null>;
  deleteForUser(id: string, userId: string): Promise<number>;
}

@Injectable()
export class TypeOrmContactRepository implements ContactRepository {
  constructor(
    @InjectRepository(Contact)
    private readonly repo: Repository<Contact>,
  ) {}

  async unsetPrimaryForType(userId: string, type: ContactType): Promise<void> {
    await this.repo.update(
      { user: { id: userId }, type, isPrimary: true },
      { isPrimary: false },
    );
  }

  create(data: Partial<Contact>): Contact {
    return this.repo.create(data);
  }

  save(contact: Contact): Promise<Contact> {
    return this.repo.save(contact);
  }

  findPrimary(userId: string, type: ContactType): Promise<Contact | null> {
    return this.repo.findOne({
      where: { user: { id: userId }, type, isPrimary: true },
    });
  }

  findByIdForUser(id: string, userId: string): Promise<Contact | null> {
    return this.repo.findOne({
      where: { id, user: { id: userId } },
    });
  }

  async deleteForUser(id: string, userId: string): Promise<number> {
    const result = await this.repo.delete({ id, user: { id: userId } });
    return result.affected ?? 0;
  }
}

