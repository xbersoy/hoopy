import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../entities/company.entity';
import { User } from '../../user/entities/user.entity';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
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
    return this.companyRepository.findOne({
      where: { owner: { id: ownerId } },
      relations: ['owner'],
    });
  }
} 