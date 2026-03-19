import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

import { AdminSeeder } from './seeds/tasks/01-admin.seeder';
import { ManagerSeeder } from './seeds/tasks/02-manager.seeder';
import { CompanySeeder } from './seeds/tasks/03-company.seeder';
import { OrgUnitTypeSeeder } from './seeds/tasks/05-org-unit-type.seeder';
import { OrgUnitSeeder } from './seeds/tasks/06-org-unit.seeder';
import { EmployeeSeeder } from './seeds/tasks/07-employee.seeder';
import { PermissionsSeeder } from './seeds/tasks/08-permissions.seeder';
import { CustomObjectsSeeder } from './seeds/tasks/09-custom-objects.seeder';
import { PicklistsSeeder } from './seeds/tasks/10-picklists.seeder';
import { StateMachineSeeder } from './seeds/tasks/11-state-machine.seeder';
import { WorkflowSeeder } from './seeds/tasks/12-workflow.seeder';
import { LeaveSeeder } from './seeds/tasks/13-leave.seeder';
import { TimeManagementSeeder } from './seeds/tasks/14-time-management.seeder';
import { WorkAuthorizationSeeder } from './seeds/tasks/15-work-authorization.seeder';
import { SkillsCompetenciesSeeder } from './seeds/tasks/16-skills-competencies.seeder';
import { FeedbackSeeder } from './seeds/tasks/17-feedback.seeder';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  try {
    const config = app.get(ConfigService);
    const env = config.get<string>('ENV') ?? 'development';
    console.log(`Running seed for environment: ${env}`);

    const seeders = [
      new AdminSeeder(),
      new ManagerSeeder(),
      new CompanySeeder(),
      new OrgUnitTypeSeeder(),
      new OrgUnitSeeder(),
      new EmployeeSeeder(),
      new PermissionsSeeder(),
      new CustomObjectsSeeder(),
      new PicklistsSeeder(),
      new StateMachineSeeder(),
      new WorkflowSeeder(),
      new LeaveSeeder(),
      new TimeManagementSeeder(),
      new WorkAuthorizationSeeder(),
      new SkillsCompetenciesSeeder(),
      new FeedbackSeeder(),
    ];

    for (const seeder of seeders) {
      console.log(`Running seeder: ${seeder.constructor.name}`);
      await seeder.run(app);
    }

    console.log('Seeding completed successfully.');
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

bootstrap();
