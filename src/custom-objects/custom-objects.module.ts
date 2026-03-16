import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomObjectDefinition } from './entities/custom-object-definition.entity';
import { CustomObjectDefinitionI18n } from './entities/custom-object-definition-i18n.entity';
import { CustomObjectField } from './entities/custom-object-field.entity';
import { CustomObjectFieldI18n } from './entities/custom-object-field-i18n.entity';
import { CustomObjectRecord } from './entities/custom-object-record.entity';
import { CustomObjectDefinitionsService } from './services/custom-object-definitions.service';
import { CustomObjectRecordsService } from './services/custom-object-records.service';
import { CustomObjectDefinitionsController } from './controllers/custom-object-definitions.controller';
import { CustomObjectRecordsController } from './controllers/custom-object-records.controller';
import {
  TypeOrmCustomObjectDefinitionRepository,
  TypeOrmCustomObjectFieldRepository,
  TypeOrmCustomObjectRecordRepository,
  TypeOrmCustomObjectDefinitionI18nRepository,
  TypeOrmCustomObjectFieldI18nRepository,
} from './custom-objects.repository';
import { PermissionsModule } from '../permissions/permissions.module';
import { AttachmentsModule } from '../attachments/attachments.module';
import { PicklistsModule } from '../picklists/picklists.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomObjectDefinition,
      CustomObjectDefinitionI18n,
      CustomObjectField,
      CustomObjectFieldI18n,
      CustomObjectRecord,
    ]),
    PermissionsModule,
    AttachmentsModule,
    PicklistsModule,
  ],
  controllers: [
    CustomObjectDefinitionsController,
    CustomObjectRecordsController,
  ],
  providers: [
    CustomObjectDefinitionsService,
    CustomObjectRecordsService,
    {
      provide: 'CustomObjectDefinitionRepository',
      useClass: TypeOrmCustomObjectDefinitionRepository,
    },
    {
      provide: 'CustomObjectFieldRepository',
      useClass: TypeOrmCustomObjectFieldRepository,
    },
    {
      provide: 'CustomObjectDefinitionI18nRepository',
      useClass: TypeOrmCustomObjectDefinitionI18nRepository,
    },
    {
      provide: 'CustomObjectFieldI18nRepository',
      useClass: TypeOrmCustomObjectFieldI18nRepository,
    },
    {
      provide: 'CustomObjectRecordRepository',
      useClass: TypeOrmCustomObjectRecordRepository,
    },
  ],
  exports: [CustomObjectDefinitionsService, CustomObjectRecordsService],
})
export class CustomObjectsModule {}
