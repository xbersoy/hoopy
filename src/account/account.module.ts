import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './entities/account.entity';
import { AccountService } from './services/account.service';
import { TypeOrmAccountRepository } from './account.repository';
import { AccountPreferencesController } from './controllers/account-preferences.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Account])],
  controllers: [AccountPreferencesController],
  providers: [
    AccountService,
    {
      provide: 'AccountRepository',
      useClass: TypeOrmAccountRepository,
    },
  ],
  exports: [AccountService, TypeOrmModule.forFeature([Account])],
})
export class AccountModule {}
