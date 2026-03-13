import { INestApplicationContext, Logger } from '@nestjs/common';
import { Seeder } from '../seeder.interface';
import { UserService } from '../../user/user.service';
import { CompanyService } from '../../company/services/company.service';
import { AccountService } from '../../account/services/account.service';

export class CompanySeeder implements Seeder {
  private readonly logger = new Logger(CompanySeeder.name);

  async run(app: INestApplicationContext): Promise<void> {
    const userService = app.get(UserService);
    const companyService = app.get(CompanyService);
    const accountService = app.get(AccountService);

    const managerEmail = 'manager@hoopy.com';
    let manager = null;

    try {
      const users = await userService.findAll();
      manager = users.find((u: any) => u.email === managerEmail) ?? null;
    } catch {
      // ignore
    }

    if (!manager) {
      this.logger.warn('Manager not found. Cannot seed company.');
      return;
    }

    try {
      this.logger.log('Ensuring seed company exists...');
      let company = await companyService.findByOwner(manager.id);
      if (!company) {
        const { createDefaultCompanySettings } =
          await import('../../company/factories/company-settings.factory');
        const settings = createDefaultCompanySettings();
        (settings as any).branding = { color: '#ff0000' };

        const account = await accountService.findByOwner(manager.id);
        company = await companyService.create(
          'Hoopy Corp',
          'Technology',
          manager as any,
          settings,
          account,
        );
        this.logger.log(`Created company: ${company.name} (${company.id})`);
      } else {
        this.logger.log(
          `Company already exists: ${company.name} (${company.id})`,
        );
      }
    } catch (err) {
      this.logger.warn(`Company seed step failed: ${(err as Error).message}`);
    }
  }
}
