import { INestApplicationContext, Logger } from '@nestjs/common';
import { Seeder } from '../seeder.interface';
import { UserService } from '../../user/user.service';
import { CompanyService } from '../../company/services/company.service';
import { PicklistsService } from '../../picklists/picklists.service';

export class PicklistsSeeder implements Seeder {
  private readonly logger = new Logger(PicklistsSeeder.name);

  async run(app: INestApplicationContext): Promise<void> {
    const userService = app.get(UserService);
    const companyService = app.get(CompanyService);
    const picklistsService = app.get(PicklistsService);

    const owners = [
      { email: 'admin@admin.com', label: 'Admin' },
      { email: 'manager@hoopy.com', label: 'Manager' },
    ];

    let users: any[] = [];
    try {
      users = await userService.findAll();
    } catch {
      // ignore
    }

    for (const owner of owners) {
      const user = users.find((u: any) => u.email === owner.email) ?? null;
      if (!user) continue;

      let company = null;
      try {
        company = await companyService.findByOwner(user.id);
      } catch {
        // ignore
      }
      if (!company) continue;

      this.logger.log(`Seeding picklists for ${company.name}...`);

      const picklists = await picklistsService.findAll(company.id);

      // ── Gender ─────────────────────────────────────────────────────────────
      const existingGender = picklists.find((p) => p.code === 'GND');
      if (!existingGender) {
        const genderPicklist = await picklistsService.create(company.id, {
          code: 'GND',
          isActive: true,
          translations: {
            en: { name: 'Gender' },
            tr: { name: 'Cinsiyet' },
          },
        });

        await picklistsService.createOption(company.id, genderPicklist.id, {
          code: '1',
          sortOrder: 0,
          isActive: true,
          translations: {
            en: { label: 'Male' },
            tr: { label: 'Erkek' },
          },
        });

        await picklistsService.createOption(company.id, genderPicklist.id, {
          code: '2',
          sortOrder: 1,
          isActive: true,
          translations: {
            en: { label: 'Female' },
            tr: { label: 'Kadın' },
          },
        });

        this.logger.log(`  Created 'Gender' picklist`);
      }
    }
  }
}
