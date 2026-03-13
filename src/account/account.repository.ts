import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Account } from './entities/account.entity';
import { User } from '../user/entities/user.entity';

export interface AccountRepository {
  create(data: {
    name: string;
    type: string;
    owner: User;
    settings?: Record<string, any>;
  }): Account;
  save(account: Account): Promise<Account>;
  findByOwnerId(ownerId: string): Promise<Account | null>;
  findById(id: string): Promise<Account | null>;
}

@Injectable()
export class TypeOrmAccountRepository implements AccountRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    this.repo = this.dataSource.getRepository(Account);
  }

  private readonly repo: Repository<Account>;

  create(data: {
    name: string;
    type: string;
    owner: User;
    settings?: Record<string, any>;
  }): Account {
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

  findById(id: string): Promise<Account | null> {
    return this.repo.findOne({ where: { id } });
  }
}
