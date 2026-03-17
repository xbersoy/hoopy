import { INestApplicationContext, Logger } from '@nestjs/common';
import { Seeder } from '../seeder.interface';
import { CompanyService } from '../../company/services/company.service';
import { UserService } from '../../user/user.service';
import { EmployeeService } from '../../employee/employee.service';
import { AttendanceService } from '../../time-management/attendance/services/attendance.service';
import { ScheduleTemplateService } from '../../time-management/schedules/services/schedule-template.service';
import { ShiftTemplateService } from '../../time-management/schedules/services/shift-template.service';
import { EmployeeScheduleService } from '../../time-management/schedules/services/employee-schedule.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScheduleTemplate } from '../../time-management/schedules/entities/schedule-template.entity';
import {
  AttendanceStatus,
  CheckSource,
} from '../../time-management/attendance/enums/attendance.enums';
import { ScheduleType } from '../../time-management/schedules/enums/schedule.enums';

export class TimeManagementSeeder implements Seeder {
  private readonly logger = new Logger(TimeManagementSeeder.name);

  async run(app: INestApplicationContext): Promise<void> {
    const userService = app.get(UserService);
    const companyService = app.get(CompanyService);
    const employeeService = app.get(EmployeeService);
    const attendanceService = app.get(AttendanceService);
    const scheduleTemplateService = app.get(ScheduleTemplateService);
    const shiftTemplateService = app.get(ShiftTemplateService);
    const employeeScheduleService = app.get(EmployeeScheduleService);
    const scheduleTemplateRepo = app.get<Repository<ScheduleTemplate>>(
      getRepositoryToken(ScheduleTemplate),
    );

    const users = await userService.findAll();
    const admin = users.find((u: any) => u.email === 'admin@admin.com');
    if (!admin) {
      this.logger.warn('Admin user not found — skipping time management seed.');
      return;
    }

    const company = await companyService.findByOwner(admin.id);
    if (!company) {
      this.logger.warn(
        'Admin company not found — skipping time management seed.',
      );
      return;
    }

    // Check if already seeded
    const existing = await scheduleTemplateRepo.findOne({
      where: { companyId: company.id, code: 'standard_weekday' },
    });
    if (existing) {
      this.logger.log('Time management data already exists — skipping.');
      return;
    }

    // ── 1. Create schedule templates with i18n ──
    const standardSchedule = await scheduleTemplateService.create(company.id, {
      code: 'standard_weekday',
      name: 'Standard Weekday Schedule',
      description: 'Monday to Friday, 9:00-18:00',
      scheduleType: ScheduleType.FIXED,
      workDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      defaultStartTime: '09:00',
      defaultEndTime: '18:00',
      breakDurationMinutes: 60,
      weeklyHours: 40,
      translations: {
        en: {
          name: 'Standard Weekday Schedule',
          description: 'Monday to Friday, 9:00-18:00',
        },
        tr: {
          name: 'Standart Hafta İçi Programı',
          description: 'Pazartesi - Cuma, 09:00-18:00',
        },
      },
    });
    this.logger.log(`Created schedule template: ${standardSchedule.name}`);

    const flexSchedule = await scheduleTemplateService.create(company.id, {
      code: 'flexible_weekday',
      name: 'Flexible Weekday Schedule',
      description: 'Monday to Friday, flexible hours (core: 10:00-16:00)',
      scheduleType: ScheduleType.FLEXIBLE,
      workDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      defaultStartTime: '08:00',
      defaultEndTime: '19:00',
      breakDurationMinutes: 60,
      weeklyHours: 40,
      translations: {
        en: {
          name: 'Flexible Weekday Schedule',
          description: 'Monday to Friday, flexible hours (core: 10:00-16:00)',
        },
        tr: {
          name: 'Esnek Hafta İçi Programı',
          description:
            'Pazartesi - Cuma, esnek saatler (çekirdek: 10:00-16:00)',
        },
      },
    });
    this.logger.log(`Created schedule template: ${flexSchedule.name}`);

    // ── 2. Create shift templates with i18n ──
    const morningShift = await shiftTemplateService.create(company.id, {
      code: 'morning_shift',
      name: 'Morning Shift',
      description: '06:00 - 14:00',
      startTime: '06:00',
      endTime: '14:00',
      breakDurationMinutes: 30,
      color: '#F59E0B',
      translations: {
        en: { name: 'Morning Shift', description: '06:00 - 14:00' },
        tr: { name: 'Sabah Vardiyası', description: '06:00 - 14:00' },
      },
    });
    this.logger.log(`Created shift template: ${morningShift.name}`);

    const afternoonShift = await shiftTemplateService.create(company.id, {
      code: 'afternoon_shift',
      name: 'Afternoon Shift',
      description: '14:00 - 22:00',
      startTime: '14:00',
      endTime: '22:00',
      breakDurationMinutes: 30,
      color: '#3B82F6',
      translations: {
        en: { name: 'Afternoon Shift', description: '14:00 - 22:00' },
        tr: { name: 'Öğleden Sonra Vardiyası', description: '14:00 - 22:00' },
      },
    });
    this.logger.log(`Created shift template: ${afternoonShift.name}`);

    const nightShift = await shiftTemplateService.create(company.id, {
      code: 'night_shift',
      name: 'Night Shift',
      description: '22:00 - 06:00',
      startTime: '22:00',
      endTime: '06:00',
      breakDurationMinutes: 30,
      isOvernight: true,
      color: '#6366F1',
      translations: {
        en: { name: 'Night Shift', description: '22:00 - 06:00' },
        tr: { name: 'Gece Vardiyası', description: '22:00 - 06:00' },
      },
    });
    this.logger.log(`Created shift template: ${nightShift.name}`);

    // ── 3. Assign schedules to first few employees ──
    try {
      const employees = await employeeService.findAll();
      const today = new Date();
      const yearStart = new Date(today.getFullYear(), 0, 1);

      if (employees.length > 0) {
        // Assign standard schedule to first 3 employees
        for (let i = 0; i < Math.min(3, employees.length); i++) {
          await employeeScheduleService.create(company.id, {
            employeeId: employees[i].id,
            scheduleTemplateId: standardSchedule.id,
            effectiveFrom: yearStart.toISOString().split('T')[0],
          });
          this.logger.log(
            `Assigned standard schedule to ${employees[i].firstName} ${employees[i].lastName}`,
          );
        }

        // Assign flexible schedule to next 2 employees
        for (let i = 3; i < Math.min(5, employees.length); i++) {
          await employeeScheduleService.create(company.id, {
            employeeId: employees[i].id,
            scheduleTemplateId: flexSchedule.id,
            effectiveFrom: yearStart.toISOString().split('T')[0],
          });
          this.logger.log(
            `Assigned flexible schedule to ${employees[i].firstName} ${employees[i].lastName}`,
          );
        }
      }

      // ── 4. Create sample attendance records for first employee ──
      if (employees.length > 0) {
        const emp = employees[0];
        // Create attendance for last 5 working days
        for (let dayOffset = 1; dayOffset <= 5; dayOffset++) {
          const date = new Date(today);
          date.setDate(date.getDate() - dayOffset);
          // Skip weekends
          if (date.getDay() === 0 || date.getDay() === 6) continue;

          const dateStr = date.toISOString().split('T')[0];
          const checkIn = new Date(date);
          checkIn.setHours(9, 0 + Math.floor(Math.random() * 15), 0);
          const checkOut = new Date(date);
          checkOut.setHours(18, Math.floor(Math.random() * 30), 0);

          try {
            await attendanceService.createManual(company.id, {
              employeeId: emp.id,
              date: dateStr,
              status: AttendanceStatus.PRESENT,
              checkIn: checkIn.toISOString(),
              checkOut: checkOut.toISOString(),
              checkInSource: CheckSource.WEB,
              checkOutSource: CheckSource.WEB,
            });
            this.logger.log(
              `Created attendance for ${emp.firstName} on ${dateStr}`,
            );
          } catch {
            // Skip duplicates
          }
        }
      }
    } catch (err) {
      this.logger.warn(`Could not create sample data: ${err.message}`);
    }

    this.logger.log('Time management seeding completed successfully.');
  }
}
