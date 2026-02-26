import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from './entities/user.entity';

export interface UserRepository {
  create(data: Partial<User>): User;
  save(user: User): Promise<User>;
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  remove(user: User): Promise<User>;
}

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    this.repo = this.dataSource.getRepository(User);
  }

  private readonly repo: Repository<User>;

  create(data: Partial<User>): User {
    return this.repo.create(data);
  }

  save(user: User): Promise<User> {
    return this.repo.save(user);
  }

  findAll(): Promise<User[]> {
    return this.repo.find({
      select: ['id', 'email', 'createdAt', 'updatedAt'],
    });
  }

  findById(id: string): Promise<User | null> {
    return this.repo.findOne({
      where: { id },
      select: ['id', 'email', 'createdAt', 'updatedAt'],
    });
  }

  remove(user: User): Promise<User> {
    return this.repo.remove(user);
  }
}

