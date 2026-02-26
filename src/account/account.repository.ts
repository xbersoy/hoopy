import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './entities/account.entity';
import { User } from '../user/entities/user.entity';

export interface AccountRepository {
  create(data: { name: string; type: string; owner: User }): Account;
  save(account: Account): Promise<Account>;
  findByOwnerId(ownerId: string): Promise<Account | null>;
}

@Injectable()
export class TypeOrmAccountRepository implements AccountRepository {
  constructor(
    @InjectRepository(Account)
    private readonly repo: Repository<Account>,
  ) {}

  create(data: { name: string; type: string; owner: User }): Account {
    return this.repo.create(data);
  }

  save(account: Account): Promise<Account> {
    return this.repo.save(account);
  }

  findByOwnerId(ownerId: string): Promise<Account | null> {
    return this.repo.findOne({
      where: { owner: { id: ownerId } },
      relations: ['owner'],
    });
  }
}

