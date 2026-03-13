import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { CompanyService } from './services/company.service';
import { TypeOrmCompanyRepository } from './company.repository';
import { CompanyPreferencesController } from './controllers/company-preferences.controller';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [TypeOrmModule.forFeature([Company]), PermissionsModule],
  controllers: [CompanyPreferencesController],
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
