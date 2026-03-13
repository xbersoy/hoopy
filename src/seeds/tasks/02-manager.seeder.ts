import { INestApplicationContext, Logger } from '@nestjs/common';
import { Seeder } from '../seeder.interface';
import { UserService } from '../../user/user.service';
import { AccountService } from '../../account/services/account.service';
import * as bcrypt from 'bcrypt';

export class ManagerSeeder implements Seeder {
  private readonly logger = new Logger(ManagerSeeder.name);

  async run(app: INestApplicationContext): Promise<void> {
    const userService = app.get(UserService);
    const accountService = app.get(AccountService);

    const managerEmail = 'manager@hoopy.com';
    let manager = null;
    try {
      const users = await userService.findAll();
      manager = users.find((u: any) => u.email === managerEmail) ?? null;
      if (!manager) {
        this.logger.log('Creating manager user...');
        const password = 'changeme';
        manager = await userService.create({
          email: managerEmail,
          password: await bcrypt.hash(password, 10),
          firstName: 'Company',
          lastName: 'Manager',
        } as any);
      } else {
        this.logger.log(
          'Manager user already exists; ensuring password is set to changeme.',
        );
        await userService.update(manager.id, {
          password: await bcrypt.hash('changeme', 10),
        } as any);
      }
    } catch (err) {
      this.logger.warn(
        `Manager user seed step failed: ${(err as Error).message}`,
      );
    }

    // Ensure manager has an account
    if (manager) {
      try {
        this.logger.log('Ensuring manager account exists...');
        const { createDefaultAccountSettings } =
          await import('../../account/factories/account-settings.factory');
        const settings = createDefaultAccountSettings();
        (settings as any).tier = 'enterprise';

        await accountService.create(
          'Company Manager Account',
          'BUSINESS',
          manager as any,
          settings,
        );
      } catch (err) {
        this.logger.warn(
          `Manager account seed step failed or already exists: ${(err as Error).message}`,
        );
      }
    }
  }
}
