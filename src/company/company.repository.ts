import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Company } from './entities/company.entity';
import { User } from '../user/entities/user.entity';

export interface CompanyRepository {
  create(data: { name: string; sector: string; owner: User }): Company;
  save(company: Company): Promise<Company>;
  findByOwnerId(ownerId: string): Promise<Company | null>;
}

@Injectable()
export class TypeOrmCompanyRepository implements CompanyRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    this.repo = this.dataSource.getRepository(Company);
  }

  private readonly repo: Repository<Company>;

  create(data: { name: string; sector: string; owner: User }): Company {
    return this.repo.create(data);
  }

  save(company: Company): Promise<Company> {
    return this.repo.save(company);
  }

  findByOwnerId(ownerId: string): Promise<Company | null> {
    return this.repo.findOne({
      where: { owner: { id: ownerId } },
      relations: ['owner'],
    });
  }
}

