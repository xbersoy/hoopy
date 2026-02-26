import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

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

