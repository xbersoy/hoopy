import { INestApplicationContext, Logger } from '@nestjs/common';
import { Seeder } from '../seeder.interface';
import { LeaveTypeService } from '../../leave/services/leave-type.service';
import { LeavePolicyService } from '../../leave/services/leave-policy.service';
import { LeaveGrantService } from '../../leave/services/leave-grant.service';
import { CompanyService } from '../../company/services/company.service';
import { UserService } from '../../user/user.service';
import { EmployeeService } from '../../employee/employee.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveType } from '../../leave/entities/leave-type.entity';
import {
  LeaveUnitType,
  SystemLeaveType,
  GrantStrategy,
  GrantTrigger,
  RelativeAnchor,
  CarryoverStrategy,
  ExpiryStrategy,
  RecurringPattern,
  ConsumptionStrategy,
  GrantSourceType,
} from '../../leave/enums/leave.enums';

export class LeaveSeeder implements Seeder {
  private readonly logger = new Logger(LeaveSeeder.name);

  async run(app: INestApplicationContext): Promise<void> {
    const leaveTypeService = app.get(LeaveTypeService);
    const policyService = app.get(LeavePolicyService);
    const grantService = app.get(LeaveGrantService);
    const userService = app.get(UserService);
    const companyService = app.get(CompanyService);
    const employeeService = app.get(EmployeeService);
    const leaveTypeRepo = app.get<Repository<LeaveType>>(
      getRepositoryToken(LeaveType),
    );

    const users = await userService.findAll();
    const admin = users.find((u: any) => u.email === 'admin@admin.com');
    if (!admin) {
      this.logger.warn('Admin user not found — skipping leave seed.');
      return;
    }

    const company = await companyService.findByOwner(admin.id);
    if (!company) {
      this.logger.warn('Admin company not found — skipping leave seed.');
      return;
    }

    // Check if already seeded
    const existing = await leaveTypeRepo.findOne({
      where: { companyId: company.id, code: SystemLeaveType.ANNUAL },
    });
    if (existing) {
      this.logger.log('Leave types already exist — skipping.');
      return;
    }

    // ── 1. Create system leave types with translations ──
    const systemTypes = [
      {
        code: SystemLeaveType.ANNUAL,
        name: 'Annual Leave',
        description: 'Paid annual leave entitlement',
        unitType: LeaveUnitType.DAY,
        isPaid: true,
        requiresBalance: true,
        requiresAttachment: false,
        sortOrder: 1,
        color: '#3B82F6',
        icon: 'calendar',
        translations: {
          en: {
            name: 'Annual Leave',
            description: 'Paid annual leave entitlement',
          },
          tr: { name: 'Yıllık İzin', description: 'Ücretli yıllık izin hakkı' },
        },
      },
      {
        code: SystemLeaveType.SICK,
        name: 'Sick Leave',
        description: 'Leave for illness or medical appointments',
        unitType: LeaveUnitType.DAY,
        isPaid: true,
        requiresBalance: true,
        requiresAttachment: true,
        attachmentThresholdDays: 2,
        sortOrder: 2,
        color: '#EF4444',
        icon: 'heart-pulse',
        translations: {
          en: {
            name: 'Sick Leave',
            description: 'Leave for illness or medical appointments',
          },
          tr: {
            name: 'Hastalık İzni',
            description: 'Hastalık veya tıbbi randevular için izin',
          },
        },
      },
      {
        code: SystemLeaveType.UNPAID,
        name: 'Unpaid Leave',
        description: 'Leave without pay',
        unitType: LeaveUnitType.DAY,
        isPaid: false,
        requiresBalance: false,
        requiresAttachment: false,
        sortOrder: 3,
        color: '#6B7280',
        icon: 'ban',
        translations: {
          en: { name: 'Unpaid Leave', description: 'Leave without pay' },
          tr: { name: 'Ücretsiz İzin', description: 'Ücretsiz izin' },
        },
      },
      {
        code: SystemLeaveType.MATERNITY,
        name: 'Maternity Leave',
        description: 'Leave for childbirth and newborn care',
        unitType: LeaveUnitType.DAY,
        isPaid: true,
        requiresBalance: true,
        requiresAttachment: true,
        sortOrder: 4,
        color: '#EC4899',
        icon: 'baby',
        translations: {
          en: {
            name: 'Maternity Leave',
            description: 'Leave for childbirth and newborn care',
          },
          tr: {
            name: 'Doğum İzni',
            description: 'Doğum ve yenidoğan bakımı için izin',
          },
        },
      },
      {
        code: SystemLeaveType.PATERNITY,
        name: 'Paternity Leave',
        description: 'Leave for new fathers',
        unitType: LeaveUnitType.DAY,
        isPaid: true,
        requiresBalance: true,
        requiresAttachment: true,
        sortOrder: 5,
        color: '#8B5CF6',
        icon: 'baby',
        translations: {
          en: { name: 'Paternity Leave', description: 'Leave for new fathers' },
          tr: { name: 'Babalık İzni', description: 'Yeni babalar için izin' },
        },
      },
      {
        code: SystemLeaveType.BEREAVEMENT,
        name: 'Bereavement Leave',
        description: 'Leave for family loss',
        unitType: LeaveUnitType.DAY,
        isPaid: true,
        requiresBalance: true,
        requiresAttachment: false,
        sortOrder: 6,
        color: '#374151',
        icon: 'heart',
        translations: {
          en: {
            name: 'Bereavement Leave',
            description: 'Leave for family loss',
          },
          tr: { name: 'Vefat İzni', description: 'Aile kaybı için izin' },
        },
      },
    ];

    const createdTypes: Record<string, LeaveType> = {};
    for (const typeDto of systemTypes) {
      const lt = await leaveTypeService.create(company.id, typeDto);
      createdTypes[lt.code] = lt;
      this.logger.log(`Created leave type: ${lt.name}`);
    }

    // ── 2. Create a custom leave type with translations ──
    const welcomeType = await leaveTypeService.create(company.id, {
      code: 'new_joiner_welcome',
      name: 'New Joiner Welcome Leave',
      description: 'Extra leave for new employees valid during first 6 months',
      unitType: LeaveUnitType.DAY,
      isPaid: true,
      requiresBalance: true,
      requiresAttachment: false,
      sortOrder: 10,
      color: '#10B981',
      icon: 'gift',
      translations: {
        en: {
          name: 'New Joiner Welcome Leave',
          description:
            'Extra leave for new employees valid during first 6 months',
        },
        tr: {
          name: 'Yeni İşe Başlama İzni',
          description: 'İlk 6 ay geçerli olan yeni çalışanlar için ek izin',
        },
      },
    });
    createdTypes[welcomeType.code] = welcomeType;
    this.logger.log(`Created custom leave type: ${welcomeType.name}`);

    // ── 3. Create leave policies with translations ──

    // Standard Annual Leave Policy — 14 days/year
    const annualPolicy = await policyService.create(company.id, {
      leaveTypeId: createdTypes[SystemLeaveType.ANNUAL].id,
      code: 'standard_annual',
      name: 'Standard Annual Leave Policy',
      description: '14 days per calendar year with 5-day carryover',
      priority: 0,
      translations: {
        en: {
          name: 'Standard Annual Leave Policy',
          description: '14 days per calendar year with 5-day carryover',
        },
        tr: {
          name: 'Standart Yıllık İzin Politikası',
          description: 'Yılda 14 gün, 5 gün devir hakkı ile',
        },
      },
      entitlementRules: [
        {
          name: '14 days per year',
          grantStrategy: GrantStrategy.RECURRING,
          grantAmount: 14,
          grantTrigger: GrantTrigger.CALENDAR_YEAR_START,
          relativeAnchor: RelativeAnchor.CALENDAR_YEAR_START,
          relativeStartOffsetDays: 0,
          recurringPattern: RecurringPattern.YEARLY,
          carryoverStrategy: CarryoverStrategy.CAPPED,
          carryoverMaxDays: 5,
          expiryStrategy: ExpiryStrategy.END_OF_PERIOD,
          consumptionStrategy: ConsumptionStrategy.EARLIEST_EXPIRING_FIRST,
        },
      ],
    });
    this.logger.log(`Created policy: ${annualPolicy.name}`);

    // Standard Sick Leave Policy — 10 days/year
    const sickPolicy = await policyService.create(company.id, {
      leaveTypeId: createdTypes[SystemLeaveType.SICK].id,
      code: 'standard_sick',
      name: 'Standard Sick Leave Policy',
      description: '10 days per calendar year, attachment after 2 days',
      priority: 0,
      translations: {
        en: {
          name: 'Standard Sick Leave Policy',
          description: '10 days per calendar year, attachment after 2 days',
        },
        tr: {
          name: 'Standart Hastalık İzni Politikası',
          description: 'Yılda 10 gün, 2 günden sonra rapor gerekli',
        },
      },
      entitlementRules: [
        {
          name: '10 days per year',
          grantStrategy: GrantStrategy.RECURRING,
          grantAmount: 10,
          grantTrigger: GrantTrigger.CALENDAR_YEAR_START,
          relativeAnchor: RelativeAnchor.CALENDAR_YEAR_START,
          recurringPattern: RecurringPattern.YEARLY,
          carryoverStrategy: CarryoverStrategy.NONE,
          expiryStrategy: ExpiryStrategy.END_OF_PERIOD,
          consumptionStrategy: ConsumptionStrategy.EARLIEST_EXPIRING_FIRST,
        },
      ],
    });
    this.logger.log(`Created policy: ${sickPolicy.name}`);

    // New Joiner Welcome Leave Policy — 7 days in first 6 months
    const welcomePolicy = await policyService.create(company.id, {
      leaveTypeId: welcomeType.id,
      code: 'new_joiner_welcome',
      name: 'New Joiner Welcome Leave Policy',
      description:
        '7 days of extra leave valid during first 6 months of employment',
      priority: 0,
      translations: {
        en: {
          name: 'New Joiner Welcome Leave Policy',
          description:
            '7 days of extra leave valid during first 6 months of employment',
        },
        tr: {
          name: 'Yeni İşe Başlama İzin Politikası',
          description: 'İstihdamın ilk 6 ayında geçerli 7 günlük ek izin',
        },
      },
      entitlementRules: [
        {
          name: '7 days for first 6 months',
          grantStrategy: GrantStrategy.ONE_TIME,
          grantAmount: 7,
          grantTrigger: GrantTrigger.EMPLOYMENT_START,
          relativeAnchor: RelativeAnchor.EMPLOYMENT_START,
          relativeStartOffsetDays: 0,
          relativeEndOffsetDays: 180,
          maxGrantsPerEmployee: 1,
          carryoverStrategy: CarryoverStrategy.NONE,
          expiryStrategy: ExpiryStrategy.FIXED_DAYS_AFTER_GRANT,
          expiryDays: 180,
          consumptionStrategy: ConsumptionStrategy.EARLIEST_EXPIRING_FIRST,
        },
      ],
    });
    this.logger.log(`Created policy: ${welcomePolicy.name}`);

    // ── 4. Create sample grants for first employee ──
    try {
      const employees = await employeeService.findAll();
      if (employees.length > 0) {
        const emp = employees[0];
        const yearStart = new Date(new Date().getFullYear(), 0, 1);
        const yearEnd = new Date(new Date().getFullYear(), 11, 31);

        // Annual leave grant
        await grantService.createGrant(company.id, {
          employeeId: emp.id,
          leaveTypeId: createdTypes[SystemLeaveType.ANNUAL].id,
          leavePolicyId: annualPolicy.id,
          entitlementRuleId: annualPolicy.entitlementRules?.[0]?.id,
          grantReason: 'Annual leave entitlement for current year',
          grantedAmount: 14,
          validFrom: yearStart,
          validUntil: yearEnd,
          sourceType: GrantSourceType.ENTITLEMENT_RULE,
        });
        this.logger.log(
          `Granted 14 annual leave days to ${emp.firstName} ${emp.lastName}`,
        );

        // Sick leave grant
        await grantService.createGrant(company.id, {
          employeeId: emp.id,
          leaveTypeId: createdTypes[SystemLeaveType.SICK].id,
          leavePolicyId: sickPolicy.id,
          entitlementRuleId: sickPolicy.entitlementRules?.[0]?.id,
          grantReason: 'Sick leave entitlement for current year',
          grantedAmount: 10,
          validFrom: yearStart,
          validUntil: yearEnd,
          sourceType: GrantSourceType.ENTITLEMENT_RULE,
        });
        this.logger.log(
          `Granted 10 sick leave days to ${emp.firstName} ${emp.lastName}`,
        );

        // New joiner welcome leave (valid 6 months from hire date)
        const hireDate = emp.hireDate ? new Date(emp.hireDate) : new Date();
        const welcomeExpiry = new Date(hireDate);
        welcomeExpiry.setDate(welcomeExpiry.getDate() + 180);
        await grantService.createGrant(company.id, {
          employeeId: emp.id,
          leaveTypeId: welcomeType.id,
          leavePolicyId: welcomePolicy.id,
          entitlementRuleId: welcomePolicy.entitlementRules?.[0]?.id,
          grantReason: 'New joiner welcome leave',
          grantedAmount: 7,
          validFrom: hireDate,
          validUntil: welcomeExpiry,
          sourceType: GrantSourceType.ENTITLEMENT_RULE,
        });
        this.logger.log(
          `Granted 7 welcome leave days to ${emp.firstName} ${emp.lastName}`,
        );
      }
    } catch (err) {
      this.logger.warn(`Could not create sample grants: ${err.message}`);
    }

    this.logger.log('Leave seeding completed successfully.');
  }
}
