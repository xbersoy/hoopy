import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrgUnitType } from './entities/org-unit-type.entity';
import { OrgUnitTypeI18n } from './entities/org-unit-type-i18n.entity';
import { OrgUnit } from './entities/org-unit.entity';
import { OrgUnitLink } from './entities/org-unit-link.entity';
import { OrgUnitTypeService } from './services/org-unit-type.service';
import { OrgUnitService } from './services/org-unit.service';
import { TypeOrmOrgUnitTypeRepository } from './repositories/org-unit-type.repository';
import { TypeOrmOrgUnitTypeI18nRepository } from './repositories/org-unit-type.repository';
import { TypeOrmOrgUnitRepository } from './repositories/org-unit.repository';
import { OrgUnitTypeController } from './controllers/org-unit-type.controller';
import { OrgUnitController } from './controllers/org-unit.controller';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrgUnitType,
      OrgUnitTypeI18n,
      OrgUnit,
      OrgUnitLink,
    ]),
    PermissionsModule,
  ],
  controllers: [OrgUnitTypeController, OrgUnitController],
  providers: [
    OrgUnitTypeService,
    OrgUnitService,
    {
      provide: 'OrgUnitTypeRepository',
      useClass: TypeOrmOrgUnitTypeRepository,
    },
    {
      provide: 'OrgUnitTypeI18nRepository',
      useClass: TypeOrmOrgUnitTypeI18nRepository,
    },
    {
      provide: 'OrgUnitRepository',
      useClass: TypeOrmOrgUnitRepository,
    },
  ],
  exports: [OrgUnitTypeService, OrgUnitService],
})
export class OrgStructureModule {}
