import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTimeManagementTables1940000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── Leave i18n tables ──────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "leave_type_i18n" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" uuid NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
        "leave_type_id" uuid NOT NULL REFERENCES "leave_types"("id") ON DELETE CASCADE,
        "locale" varchar(35) NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_leave_type_i18n_locale" UNIQUE ("leave_type_id", "locale")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_leave_type_i18n_company_locale" ON "leave_type_i18n" ("company_id", "locale")`);

    await queryRunner.query(`
      CREATE TABLE "leave_policy_i18n" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" uuid NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
        "leave_policy_id" uuid NOT NULL REFERENCES "leave_policies"("id") ON DELETE CASCADE,
        "locale" varchar(35) NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_leave_policy_i18n_locale" UNIQUE ("leave_policy_id", "locale")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_leave_policy_i18n_company_locale" ON "leave_policy_i18n" ("company_id", "locale")`);

    // ─── Attendance tables ──────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "attendance_records" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" uuid NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
        "employee_id" uuid NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
        "date" date NOT NULL,
        "status" varchar(30) NOT NULL DEFAULT 'PRESENT',
        "check_in" timestamptz,
        "check_out" timestamptz,
        "check_in_source" varchar(30),
        "check_out_source" varchar(30),
        "worked_minutes" int,
        "break_minutes" int DEFAULT 0,
        "overtime_minutes" int DEFAULT 0,
        "late_minutes" int DEFAULT 0,
        "early_departure_minutes" int DEFAULT 0,
        "is_overnight" boolean DEFAULT false,
        "timezone" varchar(50),
        "notes" text,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_attendance_employee_date" UNIQUE ("company_id", "employee_id", "date")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_attendance_company_date" ON "attendance_records" ("company_id", "date")`);
    await queryRunner.query(`CREATE INDEX "IDX_attendance_employee" ON "attendance_records" ("employee_id", "date")`);

    await queryRunner.query(`
      CREATE TABLE "attendance_correction_requests" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" uuid NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
        "employee_id" uuid NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
        "attendance_record_id" uuid REFERENCES "attendance_records"("id") ON DELETE SET NULL,
        "date" date NOT NULL,
        "correction_type" varchar(30) NOT NULL,
        "requested_check_in" timestamptz,
        "requested_check_out" timestamptz,
        "reason" text NOT NULL,
        "status" varchar(30) NOT NULL DEFAULT 'PENDING',
        "reviewer_id" uuid,
        "reviewed_at" timestamptz,
        "review_notes" text,
        "workflow_instance_id" uuid,
        "state_machine_instance_id" uuid,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_correction_company_status" ON "attendance_correction_requests" ("company_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_correction_employee" ON "attendance_correction_requests" ("employee_id")`);

    // ─── Schedule tables ────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "schedule_templates" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" uuid NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
        "code" varchar(100) NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" text,
        "schedule_type" varchar(30) NOT NULL DEFAULT 'FIXED',
        "work_days" jsonb NOT NULL DEFAULT '[]',
        "default_start_time" time,
        "default_end_time" time,
        "break_duration_minutes" int DEFAULT 60,
        "is_overnight" boolean DEFAULT false,
        "weekly_hours" numeric(5,2),
        "is_active" boolean DEFAULT true,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_schedule_template_company_code" UNIQUE ("company_id", "code")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "schedule_template_i18n" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" uuid NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
        "schedule_template_id" uuid NOT NULL REFERENCES "schedule_templates"("id") ON DELETE CASCADE,
        "locale" varchar(35) NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_schedule_template_i18n_locale" UNIQUE ("schedule_template_id", "locale")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "shift_templates" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" uuid NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
        "code" varchar(100) NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" text,
        "start_time" time NOT NULL,
        "end_time" time NOT NULL,
        "break_duration_minutes" int DEFAULT 60,
        "is_overnight" boolean DEFAULT false,
        "color" varchar(20),
        "is_active" boolean DEFAULT true,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_shift_template_company_code" UNIQUE ("company_id", "code")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "shift_template_i18n" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" uuid NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
        "shift_template_id" uuid NOT NULL REFERENCES "shift_templates"("id") ON DELETE CASCADE,
        "locale" varchar(35) NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_shift_template_i18n_locale" UNIQUE ("shift_template_id", "locale")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "employee_schedules" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" uuid NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
        "employee_id" uuid NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
        "schedule_template_id" uuid NOT NULL REFERENCES "schedule_templates"("id") ON DELETE CASCADE,
        "shift_template_id" uuid REFERENCES "shift_templates"("id") ON DELETE SET NULL,
        "effective_from" date NOT NULL,
        "effective_until" date,
        "is_active" boolean DEFAULT true,
        "notes" text,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_emp_schedule_employee" ON "employee_schedules" ("employee_id", "effective_from")`);
    await queryRunner.query(`CREATE INDEX "IDX_emp_schedule_company" ON "employee_schedules" ("company_id")`);

    // ─── Timesheet tables ───────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "timesheet_periods" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" uuid NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
        "employee_id" uuid NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
        "period_start" date NOT NULL,
        "period_end" date NOT NULL,
        "status" varchar(30) NOT NULL DEFAULT 'DRAFT',
        "total_worked_minutes" int DEFAULT 0,
        "total_overtime_minutes" int DEFAULT 0,
        "submitted_at" timestamptz,
        "approved_at" timestamptz,
        "approved_by" uuid,
        "rejected_at" timestamptz,
        "rejection_reason" text,
        "is_locked" boolean DEFAULT false,
        "workflow_instance_id" uuid,
        "state_machine_instance_id" uuid,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_timesheet_period" UNIQUE ("company_id", "employee_id", "period_start", "period_end")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_timesheet_employee" ON "timesheet_periods" ("employee_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_timesheet_company_status" ON "timesheet_periods" ("company_id", "status")`);

    await queryRunner.query(`
      CREATE TABLE "timesheet_entries" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "timesheet_period_id" uuid NOT NULL REFERENCES "timesheet_periods"("id") ON DELETE CASCADE,
        "date" date NOT NULL,
        "start_time" timestamptz,
        "end_time" timestamptz,
        "worked_minutes" int NOT NULL DEFAULT 0,
        "break_minutes" int DEFAULT 0,
        "overtime_minutes" int DEFAULT 0,
        "description" text,
        "project_code" varchar(100),
        "task_code" varchar(100),
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_timesheet_entry_period" ON "timesheet_entries" ("timesheet_period_id", "date")`);

    // ─── Overtime & Comp-Off tables ─────────────────────────
    await queryRunner.query(`
      CREATE TABLE "overtime_requests" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" uuid NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
        "employee_id" uuid NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
        "date" date NOT NULL,
        "planned_minutes" int NOT NULL,
        "actual_minutes" int,
        "reason" text NOT NULL,
        "status" varchar(30) NOT NULL DEFAULT 'PENDING',
        "compensation_type" varchar(30) NOT NULL DEFAULT 'PAID',
        "reviewer_id" uuid,
        "reviewed_at" timestamptz,
        "review_notes" text,
        "workflow_instance_id" uuid,
        "state_machine_instance_id" uuid,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_overtime_company_status" ON "overtime_requests" ("company_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_overtime_employee" ON "overtime_requests" ("employee_id")`);

    await queryRunner.query(`
      CREATE TABLE "comp_off_grants" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" uuid NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
        "employee_id" uuid NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
        "overtime_request_id" uuid REFERENCES "overtime_requests"("id") ON DELETE SET NULL,
        "granted_days" numeric(5,2) NOT NULL,
        "consumed_days" numeric(5,2) DEFAULT 0,
        "remaining_days" numeric(5,2) NOT NULL,
        "valid_from" date NOT NULL,
        "valid_until" date,
        "status" varchar(30) NOT NULL DEFAULT 'ACTIVE',
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_compoff_employee" ON "comp_off_grants" ("employee_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_compoff_company_status" ON "comp_off_grants" ("company_id", "status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "comp_off_grants" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "overtime_requests" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "timesheet_entries" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "timesheet_periods" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "employee_schedules" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "shift_template_i18n" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "shift_templates" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "schedule_template_i18n" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "schedule_templates" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "attendance_correction_requests" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "attendance_records" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "leave_policy_i18n" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "leave_type_i18n" CASCADE`);
  }
}
