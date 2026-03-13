import { INestApplicationContext, Logger } from '@nestjs/common';
import { Seeder } from '../seeder.interface';
import { UserService } from '../../user/user.service';
import { CompanyService } from '../../company/services/company.service';
import { OrgUnitTypeService } from '../../org-structure/services/org-unit-type.service';
import { OrgUnitService } from '../../org-structure/services/org-unit.service';

export class OrgUnitSeeder implements Seeder {
  private readonly logger = new Logger(OrgUnitSeeder.name);

  async run(app: INestApplicationContext): Promise<void> {
    const userService = app.get(UserService);
    const companyService = app.get(CompanyService);
    const orgUnitTypeService = app.get(OrgUnitTypeService);
    const orgUnitService = app.get(OrgUnitService);

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
        const existingRoots = await orgUnitService.findChildren(company.id);
        if (existingRoots.length > 0) {
          this.logger.log(
            `  [${company.name}] Already has ${existingRoots.length} root(s); skipping.`,
          );
          continue;
        }

        this.logger.log(`Creating org structure for ${company.name}...`);

        const types = await orgUnitTypeService.findAll(company.id);
        const typeBySlug = types.reduce(
          (acc, t) => ({ ...acc, [t.slug]: t }),
          {} as Record<string, any>,
        );

        const div = typeBySlug['division']?.id;
        const dept = typeBySlug['department']?.id;
        const team = typeBySlug['team']?.id;

        await this.createOrgTree(orgUnitService, company.id, div, dept, team);

        this.logger.log(
          `  [${company.name}] Org structure created: 1 root, 6 departments, 18 teams.`,
        );
      } catch (err) {
        this.logger.warn(
          `Org structure seed failed for ${company.name}: ${(err as Error).message}`,
        );
      }
    }
  }

  private async createOrgTree(
    orgUnitService: OrgUnitService,
    companyId: string,
    div: string | undefined,
    dept: string | undefined,
    team: string | undefined,
  ): Promise<void> {
    // ── Root: Headquarters ──────────────────────────────────────
    const hq = await orgUnitService.create(companyId, {
      name: 'Headquarters',
      code: 'HQ',
      typeId: div,
      description: 'Company headquarters',
    });

    // ── Engineering ─────────────────────────────────────────────
    const engineering = await orgUnitService.create(companyId, {
      name: 'Engineering',
      code: 'ENG',
      parentId: hq.id,
      typeId: dept,
      description: 'Engineering department',
      sortOrder: 1,
    });

    for (const [code, name, order] of [
      ['FE', 'Frontend', 1],
      ['BE', 'Backend', 2],
      ['INFRA', 'Infrastructure', 3],
      ['MOB', 'Mobile', 4],
      ['QA', 'Quality Assurance', 5],
    ] as const) {
      await orgUnitService.create(companyId, {
        name,
        code,
        parentId: engineering.id,
        typeId: team,
        sortOrder: order,
      });
    }

    // ── Product ─────────────────────────────────────────────────
    const product = await orgUnitService.create(companyId, {
      name: 'Product',
      code: 'PRD',
      parentId: hq.id,
      typeId: dept,
      description: 'Product department',
      sortOrder: 2,
    });

    for (const [code, name, order] of [
      ['DSG', 'Design', 1],
      ['PM', 'Product Management', 2],
      ['UXR', 'UX Research', 3],
    ] as const) {
      await orgUnitService.create(companyId, {
        name,
        code,
        parentId: product.id,
        typeId: team,
        sortOrder: order,
      });
    }

    // ── Sales & Marketing ───────────────────────────────────────
    const salesMarketing = await orgUnitService.create(companyId, {
      name: 'Sales & Marketing',
      code: 'SM',
      parentId: hq.id,
      typeId: dept,
      description: 'Sales and marketing department',
      sortOrder: 3,
    });

    for (const [code, name, order] of [
      ['SLS', 'Sales', 1],
      ['MKT', 'Marketing', 2],
      ['BD', 'Business Development', 3],
    ] as const) {
      await orgUnitService.create(companyId, {
        name,
        code,
        parentId: salesMarketing.id,
        typeId: team,
        sortOrder: order,
      });
    }

    // ── Human Resources ─────────────────────────────────────────
    const hr = await orgUnitService.create(companyId, {
      name: 'Human Resources',
      code: 'HR',
      parentId: hq.id,
      typeId: dept,
      description: 'Human resources department',
      sortOrder: 4,
    });

    for (const [code, name, order] of [
      ['REC', 'Recruiting', 1],
      ['POPS', 'People Operations', 2],
    ] as const) {
      await orgUnitService.create(companyId, {
        name,
        code,
        parentId: hr.id,
        typeId: team,
        sortOrder: order,
      });
    }

    // ── Finance & Legal ─────────────────────────────────────────
    const finance = await orgUnitService.create(companyId, {
      name: 'Finance & Legal',
      code: 'FIN',
      parentId: hq.id,
      typeId: dept,
      description: 'Finance and legal department',
      sortOrder: 5,
    });

    for (const [code, name, order] of [
      ['ACC', 'Accounting', 1],
      ['LGL', 'Legal', 2],
    ] as const) {
      await orgUnitService.create(companyId, {
        name,
        code,
        parentId: finance.id,
        typeId: team,
        sortOrder: order,
      });
    }

    // ── Operations ──────────────────────────────────────────────
    const operations = await orgUnitService.create(companyId, {
      name: 'Operations',
      code: 'OPS',
      parentId: hq.id,
      typeId: dept,
      description: 'Operations department',
      sortOrder: 6,
    });

    for (const [code, name, order] of [
      ['ITS', 'IT Support', 1],
      ['FAC', 'Facilities', 2],
      ['SEC', 'Security', 3],
    ] as const) {
      await orgUnitService.create(companyId, {
        name,
        code,
        parentId: operations.id,
        typeId: team,
        sortOrder: order,
      });
    }
  }
}
