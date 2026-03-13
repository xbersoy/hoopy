import { INestApplicationContext, Logger } from '@nestjs/common';
import { Seeder } from '../seeder.interface';
import { UserService } from '../../user/user.service';
import { CompanyService } from '../../company/services/company.service';
import { PicklistsService } from '../../picklists/picklists.service';
import { CustomObjectDefinitionsService } from '../../custom-objects/services/custom-object-definitions.service';
import { CustomObjectRecordsService } from '../../custom-objects/services/custom-object-records.service';
import { CustomFieldType } from '../../custom-objects/enums/custom-field-type.enum';

export class CustomObjectsSeeder implements Seeder {
  private readonly logger = new Logger(CustomObjectsSeeder.name);

  async run(app: INestApplicationContext): Promise<void> {
    const userService = app.get(UserService);
    const companyService = app.get(CompanyService);
    const picklistsService = app.get(PicklistsService);
    const definitionsService = app.get(CustomObjectDefinitionsService);
    const recordsService = app.get(CustomObjectRecordsService);

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

      this.logger.log(`Seeding custom objects for ${company.name}...`);

      // 1. Seed Picklists
      const picklists = await picklistsService.findAll(company.id);

      let conditionPicklist: { id: string; code: string } | undefined = picklists.find((p) => p.code === 'DEVICE_CONDITION');
      if (!conditionPicklist) {
        conditionPicklist = await picklistsService.create(company.id, {
          code: 'DEVICE_CONDITION',
          isActive: true,
          translations: {
            en: { name: 'Device Condition' },
            tr: { name: 'Cihaz Durumu' },
          },
        });

        // Add options natively over their distinct method
        await picklistsService.createOption(company.id, conditionPicklist.id, {
          code: 'NEW',
          sortOrder: 0,
          isActive: true,
          translations: {
            en: { label: 'New' },
            tr: { label: 'Yeni' },
          },
        });
        await picklistsService.createOption(company.id, conditionPicklist.id, {
          code: 'GOOD',
          sortOrder: 1,
          isActive: true,
          translations: {
            en: { label: 'Good' },
            tr: { label: 'İyi' },
          },
        });
        await picklistsService.createOption(company.id, conditionPicklist.id, {
          code: 'POOR',
          sortOrder: 2,
          isActive: true,
          translations: {
            en: { label: 'Poor' },
            tr: { label: 'Kötü' },
          },
        });
      }

      // 2. Seed "Asset Management" Custom Object
      const existingDefs = await definitionsService.findAll(company.id, { limit: 100 });
      let assetDef = existingDefs.data.find((d) => d.code === 'ASSET_MGMT');
      if (!assetDef) {
        assetDef = await definitionsService.create(
          {
            code: 'ASSET_MGMT',
            label: 'Asset Management',
            description: 'Track company hardware assets',
            baseObjectType: 'EMPLOYEE',
            isActive: true,
            translations: { tr: { name: 'Zimmet Yönetimi', description: 'Şirket donanımlarını takip et' } },
            fields: [
              {
                code: 'SERIAL_NUMBER',
                label: 'Serial Number',
                dataType: CustomFieldType.STRING,
                isRequired: true,
                sortOrder: 0,
              },
              {
                code: 'PURCHASE_DATE',
                label: 'Purchase Date',
                dataType: CustomFieldType.DATE,
                isRequired: false,
                sortOrder: 1,
              },
              {
                code: 'CONDITION',
                label: 'Condition',
                dataType: CustomFieldType.PICKLIST,
                picklistId: conditionPicklist.id,
                isRequired: true,
                sortOrder: 2,
              },
              // Attachment for invoice Proof
              {
                code: 'INVOICE',
                label: 'Invoice Attachment',
                dataType: CustomFieldType.ATTACHMENT,
                isRequired: false,
                sortOrder: 3,
              }
            ],
          },
          company.id,
          user.id,
        );
        this.logger.log(`  Created 'Asset Management' Definition`);
      }

      // 3. Seed "Hardware Request" Custom Object (Relational)
      let requestDef = existingDefs.data.find((d) => d.code === 'HDW_REQUEST');
      if (!requestDef) {
        requestDef = await definitionsService.create(
          {
            code: 'HDW_REQUEST',
            label: 'Hardware Request',
            description: 'Request new hardware',
            baseObjectType: 'EMPLOYEE',
            isActive: true,
            fields: [
              {
                code: 'REASON',
                label: 'Request Reason',
                dataType: CustomFieldType.STRING,
                isRequired: true,
                sortOrder: 0,
              },
              {
                code: 'REPLACEMENT_FOR_ASSET',
                label: 'Replacement For (Asset Reference)',
                dataType: CustomFieldType.CUSTOM_OBJECT,
                referencedDefinitionId: assetDef.id,
                isRequired: false,
                sortOrder: 1,
              },
            ],
          },
          company.id,
          user.id,
        );
        this.logger.log(`  Created 'Hardware Request' Definition`);
      }
    }
  }
}
