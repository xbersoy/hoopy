import { INestApplicationContext, Logger } from '@nestjs/common';
import { Seeder } from '../seeder.interface';
import { UserService } from '../../user/user.service';
import { CompanyService } from '../../company/services/company.service';
import { OrgUnitTypeService } from '../../org-structure/services/org-unit-type.service';

const TYPE_SEED_DATA = [
  {
    slug: 'division',
    color: '#6366F1',
    icon: 'building-2',
    translations: {
      en: { name: 'Division' },
      tr: { name: 'Bölüm' },
    },
  },
  {
    slug: 'department',
    color: '#3B82F6',
    icon: 'briefcase',
    translations: {
      en: { name: 'Department' },
      tr: { name: 'Departman' },
    },
  },
  {
    slug: 'team',
    color: '#10B981',
    icon: 'users',
    translations: {
      en: { name: 'Team' },
      tr: { name: 'Takım' },
    },
  },
];

export class OrgUnitTypeSeeder implements Seeder {
  private readonly logger = new Logger(OrgUnitTypeSeeder.name);

  async run(app: INestApplicationContext): Promise<void> {
    const userService = app.get(UserService);
    const companyService = app.get(CompanyService);
    const orgUnitTypeService = app.get(OrgUnitTypeService);

    const owners = [
      { email: 'manager@hoopy.com', label: 'Manager' },
      { email: 'admin@admin.com', label: 'Admin' },
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

      try {
        this.logger.log(
          `Ensuring org unit types for ${company.name} (${owner.label})...`,
        );
        const existingTypes = await orgUnitTypeService.findAll(company.id);

        for (const typeData of TYPE_SEED_DATA) {
          const existing = existingTypes.find((t) => t.slug === typeData.slug);
          if (existing) {
            this.logger.log(
              `  [${company.name}] Type "${typeData.slug}" already exists.`,
            );
          } else {
            await orgUnitTypeService.create(company.id, typeData);
            this.logger.log(
              `  [${company.name}] Created type: ${typeData.slug}`,
            );
          }
        }
      } catch (err) {
        this.logger.warn(
          `Org unit type seed failed for ${company.name}: ${(err as Error).message}`,
        );
      }
    }
  }
}
