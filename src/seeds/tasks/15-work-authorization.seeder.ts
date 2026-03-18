import { INestApplicationContext, Logger } from '@nestjs/common';
import { Seeder } from '../seeder.interface';
import { EmployeeService } from '../../employee/employee.service';
import { WorkAuthorizationType } from '../../employee/enums/work-authorization-type.enum';
import { WorkAuthorizationStatus } from '../../employee/enums/work-authorization-status.enum';

// Sample work authorizations for various employee scenarios
const WORK_AUTHORIZATION_DATA: Record<
  string,
  Array<{
    authorizationType: WorkAuthorizationType;
    status: WorkAuthorizationStatus;
    documentNumber?: string;
    country?: string;
    issueDate?: string;
    expirationDate?: string;
    issuingAuthority?: string;
    notes?: string;
  }>
> = {
  // US Citizens
  citizen_us: [
    {
      authorizationType: WorkAuthorizationType.CITIZEN,
      status: WorkAuthorizationStatus.ACTIVE,
      country: 'United States',
      notes: 'US Citizen - no work authorization restrictions',
    },
  ],
  // H-1B Visa holders
  h1b_active: [
    {
      authorizationType: WorkAuthorizationType.WORK_VISA,
      status: WorkAuthorizationStatus.ACTIVE,
      documentNumber: 'EAC2390000001',
      country: 'United States',
      issueDate: '2023-10-01',
      expirationDate: '2026-09-30',
      issuingAuthority: 'USCIS',
      notes: 'H-1B Visa - Initial 3-year period',
    },
  ],
  // Green Card holders
  permanent_resident: [
    {
      authorizationType: WorkAuthorizationType.PERMANENT_RESIDENT,
      status: WorkAuthorizationStatus.ACTIVE,
      documentNumber: 'GRN1234567890',
      country: 'United States',
      issueDate: '2022-05-15',
      expirationDate: '2032-05-14',
      issuingAuthority: 'USCIS',
      notes: 'Permanent Resident Card (Green Card)',
    },
  ],
  // EAD holders
  ead_active: [
    {
      authorizationType: WorkAuthorizationType.EAD,
      status: WorkAuthorizationStatus.ACTIVE,
      documentNumber: 'WAC2390000002',
      country: 'United States',
      issueDate: '2024-01-15',
      expirationDate: '2026-01-14',
      issuingAuthority: 'USCIS',
      notes: 'Employment Authorization Document - OPT STEM Extension',
    },
  ],
  // TN Visa holders
  tn_visa: [
    {
      authorizationType: WorkAuthorizationType.TN_VISA,
      status: WorkAuthorizationStatus.ACTIVE,
      documentNumber: 'TN2024001234',
      country: 'United States',
      issueDate: '2024-03-01',
      expirationDate: '2027-02-28',
      issuingAuthority: 'CBP',
      notes: 'TN Visa for Canadian professional',
    },
  ],
  // Pending authorization
  pending_auth: [
    {
      authorizationType: WorkAuthorizationType.WORK_VISA,
      status: WorkAuthorizationStatus.PENDING,
      country: 'United States',
      issuingAuthority: 'USCIS',
      notes: 'H-1B petition pending - Receipt notice received',
    },
  ],
  // Expiring soon
  expiring_soon: [
    {
      authorizationType: WorkAuthorizationType.WORK_VISA,
      status: WorkAuthorizationStatus.ACTIVE,
      documentNumber: 'EAC2190000003',
      country: 'United States',
      issueDate: '2021-04-01',
      expirationDate: '2024-03-31',
      issuingAuthority: 'USCIS',
      notes: 'H-1B Visa - Extension pending',
    },
  ],
  // European work permit
  eu_work_permit: [
    {
      authorizationType: WorkAuthorizationType.WORK_PERMIT,
      status: WorkAuthorizationStatus.ACTIVE,
      documentNumber: 'EU-WP-2023-12345',
      country: 'Germany',
      issueDate: '2023-06-01',
      expirationDate: '2027-05-31',
      issuingAuthority: 'Bundesagentur für Arbeit',
      notes: 'EU Blue Card holder',
    },
  ],
};

// Map employee names to authorization types (for seeding purposes)
const EMPLOYEE_AUTHORIZATIONS: Record<string, string> = {
  'Marcus.Chen': 'h1b_active',
  'Sofia.Rivera': 'permanent_resident',
  'Yuki.Tanaka': 'h1b_active',
  'Priya.Sharma': 'ead_active',
  'Kenji.Watanabe': 'h1b_active',
  'Anja.Mueller': 'eu_work_permit',
  'Diego.Martinez': 'tn_visa',
  'Jin.Park': 'h1b_active',
  'Mei.Zhang': 'ead_active',
  'Ravi.Patel': 'pending_auth',
  'Yusuf.Ali': 'h1b_active',
  'Elena.Kozlova': 'permanent_resident',
  'Hiroshi.Yamamoto': 'h1b_active',
  'Olga.Petrenko': 'eu_work_permit',
  'Wei.Liu': 'expiring_soon',
  'Mei-Lin.Wu': 'h1b_active',
};

export class WorkAuthorizationSeeder implements Seeder {
  private readonly logger = new Logger(WorkAuthorizationSeeder.name);

  async run(app: INestApplicationContext): Promise<void> {
    const employeeService = app.get(EmployeeService);

    this.logger.log('Seeding work authorizations...');

    try {
      const employees = await employeeService.findAll();
      let updated = 0;

      for (const employee of employees) {
        const key = `${employee.firstName}.${employee.lastName.replace(/[^a-zA-Z]/g, '')}`;
        const authType = EMPLOYEE_AUTHORIZATIONS[key];

        if (authType && WORK_AUTHORIZATION_DATA[authType]) {
          // Check if employee already has work authorizations
          if (
            employee.workAuthorizations &&
            employee.workAuthorizations.length > 0
          ) {
            continue;
          }

          try {
            await employeeService.update(employee.id, {
              workAuthorizations: WORK_AUTHORIZATION_DATA[authType],
            });
            updated++;
            this.logger.log(
              `  Added ${authType} work authorization to ${employee.firstName} ${employee.lastName}`,
            );
          } catch (err) {
            this.logger.warn(
              `Failed to add work authorization to ${employee.firstName} ${employee.lastName}: ${(err as Error).message}`,
            );
          }
        }
      }

      this.logger.log(
        `Work authorizations seeded: ${updated} employees updated`,
      );
    } catch (err) {
      this.logger.warn(
        `Work authorization seeding failed: ${(err as Error).message}`,
      );
    }
  }
}
