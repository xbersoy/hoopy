import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact } from './entities/contact.entity';
import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';
import { TypeOrmContactRepository } from './contact.repository';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [TypeOrmModule.forFeature([Contact]), PermissionsModule],
  providers: [
    ContactService,
    {
      provide: 'ContactRepository',
      useClass: TypeOrmContactRepository,
    },
  ],
  controllers: [ContactController],
  exports: [ContactService],
})
export class ContactModule {}
