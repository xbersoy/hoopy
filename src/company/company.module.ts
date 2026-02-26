import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { CompanyService } from './services/company.service';
import { TypeOrmCompanyRepository } from './company.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Company])],
  providers: [
    CompanyService,
    {
      provide: 'CompanyRepository',
      useClass: TypeOrmCompanyRepository,
    },
  ],
  exports: [CompanyService, TypeOrmModule.forFeature([Company])],
})
export class CompanyModule {} 