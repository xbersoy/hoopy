import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PicklistsService } from './picklists.service';
import { PicklistsController } from './picklists.controller';
import { Picklist } from './entities/picklist.entity';
import { PicklistI18n } from './entities/picklist-i18n.entity';
import { PicklistOption } from './entities/picklist-option.entity';
import { PicklistOptionI18n } from './entities/picklist-option-i18n.entity';
import {
  TypeOrmPicklistRepository,
  TypeOrmPicklistI18nRepository,
  TypeOrmPicklistOptionRepository,
  TypeOrmPicklistOptionI18nRepository,
} from './picklists.repository';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Picklist,
      PicklistI18n,
      PicklistOption,
      PicklistOptionI18n,
    ]),
    PermissionsModule,
  ],
  controllers: [PicklistsController],
  providers: [
    PicklistsService,
    {
      provide: 'PicklistRepository',
      useClass: TypeOrmPicklistRepository,
    },
    {
      provide: 'PicklistI18nRepository',
      useClass: TypeOrmPicklistI18nRepository,
    },
    {
      provide: 'PicklistOptionRepository',
      useClass: TypeOrmPicklistOptionRepository,
    },
    {
      provide: 'PicklistOptionI18nRepository',
      useClass: TypeOrmPicklistOptionI18nRepository,
    },
  ],
  exports: [PicklistsService],
})
export class PicklistsModule { }
