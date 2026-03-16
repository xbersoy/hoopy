import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../storage/storage.module';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';
import { Attachment } from './attachment.entity';
import { TypeOrmAttachmentRepository } from './attachment.repository';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attachment]),
    StorageModule,
    PermissionsModule,
  ],
  controllers: [AttachmentsController],
  providers: [
    AttachmentsService,
    {
      provide: 'AttachmentRepository',
      useClass: TypeOrmAttachmentRepository,
    },
  ],
  exports: [AttachmentsService],
})
export class AttachmentsModule {}
