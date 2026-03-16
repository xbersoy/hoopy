import { INestApplicationContext, Logger } from '@nestjs/common';
import { Seeder } from '../seeder.interface';
import { UserService } from '../../user/user.service';
import { AccountService } from '../../account/services/account.service';
import { CompanyService } from '../../company/services/company.service';
import { EmployeeService } from '../../employee/employee.service';
import * as bcrypt from 'bcrypt';

export class AdminSeeder implements Seeder {
  private readonly logger = new Logger(AdminSeeder.name);

  async run(app: INestApplicationContext): Promise<void> {
    const userService = app.get(UserService);
    const accountService = app.get(AccountService);
    const companyService = app.get(CompanyService);
    const employeeService = app.get(EmployeeService);

    const adminEmail = 'admin@admin.com';

    let admin = null;
    try {
      const users = await userService.findAll();
      admin = users.find((u: any) => u.email === adminEmail) ?? null;
    } catch {
      // ignore if listing users fails
    }

    if (!admin) {
      this.logger.log('Creating initial admin user...');
      const password = 'changeme';
      admin = await userService.create({
        email: adminEmail,
        password: await bcrypt.hash(password, 10),
        firstName: 'Admin',
        lastName: 'User',
      } as any);
    } else {
      this.logger.log(
        'Admin user already exists; ensuring password is set to changeme.',
      );
      await userService.update(admin.id, {
        password: await bcrypt.hash('changeme', 10),
      } as any);
    }

    // Ensure admin has an account
    let account = null;
    try {
      account = await accountService.findByOwner(admin.id);
    } catch {
      // ignore
    }

    if (!account) {
      try {
        this.logger.log('Creating admin account...');
        const { createDefaultAccountSettings } =
          await import('../../account/factories/account-settings.factory');
        const settings = createDefaultAccountSettings();
        settings.ui = { theme: 'dark' };
        (settings as any).language = 'en';

        account = await accountService.create(
          'Default Account',
          'PERSONAL',
          admin as any,
          settings,
        );
      } catch (err) {
        this.logger.warn(`Account seed step failed: ${(err as Error).message}`);
      }
    } else {
      this.logger.log('Admin account already exists.');
    }

    // Ensure admin has a company
    let company = null;
    try {
      company = await companyService.findByOwner(admin.id);
    } catch {
      // ignore
    }

    if (!company && account) {
      try {
        this.logger.log('Creating admin company...');
        const { createDefaultCompanySettings } =
          await import('../../company/factories/company-settings.factory');
        const settings = createDefaultCompanySettings();

        company = await companyService.create(
          'Admin Company',
          'General',
          admin as any,
          settings,
          account,
        );
      } catch (err) {
        this.logger.warn(`Company seed step failed: ${(err as Error).message}`);
      }
    } else if (company) {
      this.logger.log('Admin company already exists.');
    }

    // Ensure admin has an employee record
    if (company) {
      try {
        const allEmployees = await employeeService.findAll();
        const hasEmployee = allEmployees.some(
          (e: any) => e.email === adminEmail,
        );
        if (!hasEmployee) {
          this.logger.log('Creating admin employee record...');
          await employeeService.create({
            firstName: 'Admin',
            lastName: 'User',
            email: adminEmail,
            companyId: company.id,
            userId: admin.id,
          } as any);
        } else {
          this.logger.log('Admin employee record already exists.');
        }
      } catch (err) {
        this.logger.warn(
          `Employee seed step failed or already exists: ${(err as Error).message}`,
        );
      }
    }
  }
}
