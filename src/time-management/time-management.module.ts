import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
  AttendanceRecord,
  AttendanceCorrectionRequest,
} from './attendance/entities';

import {
  ScheduleTemplate,
  ScheduleTemplateI18n,
  ShiftTemplate,
  ShiftTemplateI18n,
  EmployeeSchedule,
} from './schedules/entities';

import { TimesheetPeriod, TimesheetEntry } from './timesheets/entities';

import { OvertimeRequest, CompOffGrant } from './overtime/entities';

import {
  TypeOrmAttendanceRecordRepository,
  TypeOrmAttendanceCorrectionRepository,
} from './attendance/attendance.repository';

import {
  TypeOrmScheduleTemplateRepository,
  TypeOrmScheduleTemplateI18nRepository,
  TypeOrmShiftTemplateRepository,
  TypeOrmShiftTemplateI18nRepository,
  TypeOrmEmployeeScheduleRepository,
} from './schedules/schedules.repository';

import {
  TypeOrmTimesheetPeriodRepository,
  TypeOrmTimesheetEntryRepository,
} from './timesheets/timesheets.repository';

import {
  TypeOrmOvertimeRequestRepository,
  TypeOrmCompOffGrantRepository,
} from './overtime/overtime.repository';

import { AttendanceService } from './attendance/services/attendance.service';
import { AttendanceCorrectionService } from './attendance/services/attendance-correction.service';
import { ScheduleTemplateService } from './schedules/services/schedule-template.service';
import { ShiftTemplateService } from './schedules/services/shift-template.service';
import { EmployeeScheduleService } from './schedules/services/employee-schedule.service';
import { TimesheetService } from './timesheets/services/timesheet.service';
import { OvertimeService } from './overtime/services/overtime.service';
import { CompOffService } from './overtime/services/comp-off.service';

import { AttendanceController } from './attendance/controllers/attendance.controller';
import { AttendanceCorrectionController } from './attendance/controllers/attendance-correction.controller';
import { ScheduleTemplateController } from './schedules/controllers/schedule-template.controller';
import { ShiftTemplateController } from './schedules/controllers/shift-template.controller';
import { EmployeeScheduleController } from './schedules/controllers/employee-schedule.controller';
import { TimesheetController } from './timesheets/controllers/timesheet.controller';
import { OvertimeController } from './overtime/controllers/overtime.controller';
import { CompOffController } from './overtime/controllers/comp-off.controller';

import { PermissionsModule } from '../permissions/permissions.module';
import { Employee } from '../employee/entities/employee.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AttendanceRecord,
      AttendanceCorrectionRequest,
      ScheduleTemplate,
      ScheduleTemplateI18n,
      ShiftTemplate,
      ShiftTemplateI18n,
      EmployeeSchedule,
      TimesheetPeriod,
      TimesheetEntry,
      OvertimeRequest,
      CompOffGrant,
      Employee,
    ]),
    PermissionsModule,
  ],
  controllers: [
    AttendanceController,
    AttendanceCorrectionController,
    ScheduleTemplateController,
    ShiftTemplateController,
    EmployeeScheduleController,
    TimesheetController,
    OvertimeController,
    CompOffController,
  ],
  providers: [
    // Services
    AttendanceService,
    AttendanceCorrectionService,
    ScheduleTemplateService,
    ShiftTemplateService,
    EmployeeScheduleService,
    TimesheetService,
    OvertimeService,
    CompOffService,

    // Repositories
    {
      provide: 'AttendanceRecordRepository',
      useClass: TypeOrmAttendanceRecordRepository,
    },
    {
      provide: 'AttendanceCorrectionRepository',
      useClass: TypeOrmAttendanceCorrectionRepository,
    },
    {
      provide: 'ScheduleTemplateRepository',
      useClass: TypeOrmScheduleTemplateRepository,
    },
    {
      provide: 'ScheduleTemplateI18nRepository',
      useClass: TypeOrmScheduleTemplateI18nRepository,
    },
    {
      provide: 'ShiftTemplateRepository',
      useClass: TypeOrmShiftTemplateRepository,
    },
    {
      provide: 'ShiftTemplateI18nRepository',
      useClass: TypeOrmShiftTemplateI18nRepository,
    },
    {
      provide: 'EmployeeScheduleRepository',
      useClass: TypeOrmEmployeeScheduleRepository,
    },
    {
      provide: 'TimesheetPeriodRepository',
      useClass: TypeOrmTimesheetPeriodRepository,
    },
    {
      provide: 'TimesheetEntryRepository',
      useClass: TypeOrmTimesheetEntryRepository,
    },
    {
      provide: 'OvertimeRequestRepository',
      useClass: TypeOrmOvertimeRequestRepository,
    },
    {
      provide: 'CompOffGrantRepository',
      useClass: TypeOrmCompOffGrantRepository,
    },
  ],
  exports: [
    AttendanceService,
    AttendanceCorrectionService,
    ScheduleTemplateService,
    ShiftTemplateService,
    EmployeeScheduleService,
    TimesheetService,
    OvertimeService,
    CompOffService,
  ],
})
export class TimeManagementModule {}
