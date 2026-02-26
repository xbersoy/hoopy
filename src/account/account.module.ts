import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './entities/account.entity';
import { AccountService } from './services/account.service';
import { TypeOrmAccountRepository } from './account.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Account])],
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