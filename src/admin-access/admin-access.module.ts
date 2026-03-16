import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAccess } from './entities/admin-access.entity';
import { Employee } from '../employee/entities/employee.entity';
import { AdminAccessService } from './services/admin-access.service';
import { AdminAccessGuard } from './guards/admin-access.guard';
import { AdminAccessController } from './controllers/admin-access.controller';
import { AccountModule } from '../account/account.module';

@Module({
  imports: [TypeOrmModule.forFeature([AdminAccess, Employee]), AccountModule],
  controllers: [AdminAccessController],
  providers: [AdminAccessService, AdminAccessGuard],
  exports: [AdminAccessService, AdminAccessGuard],
})
export class AdminAccessModule {}
