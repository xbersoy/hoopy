import { Inject, Injectable } from '@nestjs/common';
import { Account } from '../entities/account.entity';
import { User } from '../../user/entities/user.entity';
import { AccountRepository } from '../account.repository';

@Injectable()
export class AccountService {
  constructor(
    @Inject('AccountRepository')
    private readonly accountRepository: AccountRepository,
  ) {}

  async create(name: string, type: string, owner: User): Promise<Account> {
    const account = this.accountRepository.create({
      name,
      type,
      owner,
    });

    return this.accountRepository.save(account);
  }

  async findByOwner(ownerId: string): Promise<Account | null> {
    return this.accountRepository.findByOwnerId(ownerId);
  }
} 