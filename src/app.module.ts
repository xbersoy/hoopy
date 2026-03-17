import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { UserModule } from './user/user.module';
import { DatabaseTypeOrmModule } from '@infras/database/typeorm';
import { AuthModule } from './auth/auth.module';
import { CompanyModule } from './company/company.module';
import { AccountModule } from './account/account.module';
import { ConfigurationModule } from '@infras/configuration';
import { EmployeeModule } from './employee/employee.module';
import { StorageModule } from './storage/storage.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { OrgStructureModule } from './org-structure/org-structure.module';
import { PermissionsModule } from './permissions/permissions.module';
import { CustomObjectsModule } from './custom-objects/custom-objects.module';
import { PicklistsModule } from './picklists/picklists.module';
import { AdminAccessModule } from './admin-access/admin-access.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { StateMachineModule } from './state-machine/state-machine.module';
import { ActivityClientModule } from './activity-client/activity-client.module';
import { LeaveModule } from './leave/leave.module';
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
    AccountModule,
    EmployeeModule,
    StorageModule,
    AttachmentsModule,
    OrgStructureModule,
    PermissionsModule,
    CustomObjectsModule,
    PicklistsModule,
    AdminAccessModule,
    StateMachineModule,
    WorkflowsModule,
    ActivityClientModule,
    LeaveModule,
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
