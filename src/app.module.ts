import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { UserModule } from './user/user.module';
import { DatabaseTypeOrmModule } from '@infras/database/typeorm';
import { AuthModule } from './auth/auth.module';
import { CompanyModule } from './company/company.module';
import { ConfigurationModule } from '@infras/configuration';
import { EmployeeModule } from './employee/employee.module';
import { StorageModule } from './storage/storage.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { ConfigService } from '@nestjs/config';
import { initSupabase } from './supabase/supabase.client';

@Module({
  imports: [
    ConfigurationModule.forRootAsync({
      envFilePath: '.env',
    }),
    UserModule,
    DatabaseTypeOrmModule,
    AuthModule,
    CompanyModule,
    EmployeeModule,
    StorageModule,
    AttachmentsModule,
  ],
  controllers: [AppController],
})
export class AppModule implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  onModuleInit() {
    // Initialize Supabase client
    initSupabase(this.configService);
  }
}
