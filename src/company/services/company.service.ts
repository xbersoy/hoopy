import { Inject, Injectable } from '@nestjs/common';
import { Company } from '../entities/company.entity';
import { User } from '../../user/entities/user.entity';
import { CompanyRepository } from '../company.repository';

@Injectable()
export class CompanyService {
  constructor(
    @Inject('CompanyRepository')
    private readonly companyRepository: CompanyRepository,
  ) {}

  async create(name: string, sector: string, owner: User): Promise<Company> {
    const company = this.companyRepository.create({
      name,
      sector,
      owner,
    });

    return this.companyRepository.save(company);
  }

  async findByOwner(ownerId: string): Promise<Company | null> {
    return this.companyRepository.findByOwnerId(ownerId);
  }
} 