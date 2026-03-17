import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLeaveTables1930000000000 implements MigrationInterface {
  name = 'CreateLeaveTables1930000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── leave_types ──
    await queryRunner.query(`
      CREATE TABLE "leave_types" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid,
        "system_key" varchar(100),
        "code" varchar(100) NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" text,
        "unit_type" varchar(20) NOT NULL DEFAULT 'day',
        "is_paid" boolean NOT NULL DEFAULT true,
        "requires_balance" boolean NOT NULL DEFAULT true,
        "requires_attachment" boolean NOT NULL DEFAULT false,
        "attachment_threshold_days" int,
        "is_system" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        "sort_order" int NOT NULL DEFAULT 0,
        "color" varchar(20),
        "icon" varchar(100),
        "metadata" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_leave_types" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_leave_type_company_code" UNIQUE ("company_id", "code"),
        CONSTRAINT "FK_leave_type_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_leave_type_company" ON "leave_types" ("company_id")`,
    );

    // ── leave_policies ──
    await queryRunner.query(`
      CREATE TABLE "leave_policies" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "leave_type_id" uuid NOT NULL,
        "code" varchar(100) NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" text,
        "priority" int NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "effective_start_date" date,
        "effective_end_date" date,
        "metadata" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_leave_policies" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_leave_policy_company_code" UNIQUE ("company_id", "code"),
        CONSTRAINT "FK_leave_policy_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_leave_policy_type" FOREIGN KEY ("leave_type_id") REFERENCES "leave_types"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_leave_policy_company" ON "leave_policies" ("company_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_leave_policy_type" ON "leave_policies" ("leave_type_id")`,
    );

    // ── leave_entitlement_rules ──
    await queryRunner.query(`
      CREATE TABLE "leave_entitlement_rules" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "leave_policy_id" uuid NOT NULL,
        "name" varchar(255) NOT NULL,
        "grant_strategy" varchar(50) NOT NULL,
        "grant_amount" decimal(8,2) NOT NULL,
        "grant_trigger" varchar(50) NOT NULL,
        "relative_anchor" varchar(50),
        "relative_start_offset_days" int NOT NULL DEFAULT 0,
        "relative_end_offset_days" int,
        "recurring_pattern" varchar(20),
        "max_grants_per_employee" int,
        "carryover_strategy" varchar(20) NOT NULL DEFAULT 'none',
        "carryover_max_days" decimal(8,2),
        "expiry_strategy" varchar(50) NOT NULL DEFAULT 'end_of_period',
        "expiry_days" int,
        "consumption_strategy" varchar(50) NOT NULL DEFAULT 'earliest_expiring_first',
        "allow_negative_balance" boolean NOT NULL DEFAULT false,
        "metadata" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_leave_entitlement_rules" PRIMARY KEY ("id"),
        CONSTRAINT "FK_entitlement_rule_policy" FOREIGN KEY ("leave_policy_id") REFERENCES "leave_policies"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_entitlement_rule_policy" ON "leave_entitlement_rules" ("leave_policy_id")`,
    );

    // ── leave_grants ──
    await queryRunner.query(`
      CREATE TABLE "leave_grants" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "leave_type_id" uuid NOT NULL,
        "leave_policy_id" uuid,
        "entitlement_rule_id" uuid,
        "grant_reason" varchar(255),
        "granted_amount" decimal(8,2) NOT NULL,
        "consumed_amount" decimal(8,2) NOT NULL DEFAULT 0,
        "reserved_amount" decimal(8,2) NOT NULL DEFAULT 0,
        "remaining_amount" decimal(8,2) NOT NULL,
        "valid_from" date NOT NULL,
        "valid_until" date,
        "granted_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "source_type" varchar(50) NOT NULL,
        "status" varchar(50) NOT NULL DEFAULT 'active',
        "metadata" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_leave_grants" PRIMARY KEY ("id"),
        CONSTRAINT "FK_leave_grant_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_leave_grant_employee" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_leave_grant_type" FOREIGN KEY ("leave_type_id") REFERENCES "leave_types"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_leave_grant_policy" FOREIGN KEY ("leave_policy_id") REFERENCES "leave_policies"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_leave_grant_rule" FOREIGN KEY ("entitlement_rule_id") REFERENCES "leave_entitlement_rules"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_leave_grant_company" ON "leave_grants" ("company_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_leave_grant_employee" ON "leave_grants" ("employee_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_leave_grant_type" ON "leave_grants" ("leave_type_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_leave_grant_employee_type" ON "leave_grants" ("company_id", "employee_id", "leave_type_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_leave_grant_valid_window" ON "leave_grants" ("employee_id", "leave_type_id", "valid_from", "valid_until")`,
    );

    // ── leave_balance_ledger ──
    await queryRunner.query(`
      CREATE TABLE "leave_balance_ledger" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "leave_type_id" uuid NOT NULL,
        "leave_grant_id" uuid,
        "leave_request_id" uuid,
        "transaction_type" varchar(50) NOT NULL,
        "amount" decimal(8,2) NOT NULL,
        "occurred_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "effective_date" date NOT NULL,
        "notes" text,
        "actor_type" varchar(20) NOT NULL,
        "actor_id" uuid,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_leave_balance_ledger" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ledger_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ledger_employee" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ledger_type" FOREIGN KEY ("leave_type_id") REFERENCES "leave_types"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ledger_grant" FOREIGN KEY ("leave_grant_id") REFERENCES "leave_grants"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_balance_ledger_employee" ON "leave_balance_ledger" ("employee_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_balance_ledger_employee_type" ON "leave_balance_ledger" ("company_id", "employee_id", "leave_type_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_balance_ledger_grant" ON "leave_balance_ledger" ("leave_grant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_balance_ledger_request" ON "leave_balance_ledger" ("leave_request_id")`,
    );

    // ── leave_requests ──
    await queryRunner.query(`
      CREATE TABLE "leave_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "requester_user_id" uuid NOT NULL,
        "leave_type_id" uuid NOT NULL,
        "matched_policy_id" uuid,
        "status" varchar(50) NOT NULL DEFAULT 'draft',
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "start_session" varchar(20) NOT NULL DEFAULT 'full_day',
        "end_session" varchar(20) NOT NULL DEFAULT 'full_day',
        "duration_days" decimal(8,2) NOT NULL,
        "reason" text,
        "policy_snapshot" jsonb,
        "org_snapshot" jsonb,
        "metadata" jsonb,
        "workflow_instance_id" uuid,
        "state_machine_instance_id" uuid,
        "version_no" int NOT NULL DEFAULT 1,
        "submitted_at" TIMESTAMP WITH TIME ZONE,
        "approved_at" TIMESTAMP WITH TIME ZONE,
        "rejected_at" TIMESTAMP WITH TIME ZONE,
        "cancelled_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_leave_requests" PRIMARY KEY ("id"),
        CONSTRAINT "FK_leave_request_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_leave_request_employee" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_leave_request_type" FOREIGN KEY ("leave_type_id") REFERENCES "leave_types"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_leave_request_policy" FOREIGN KEY ("matched_policy_id") REFERENCES "leave_policies"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_leave_request_company" ON "leave_requests" ("company_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_leave_request_employee" ON "leave_requests" ("company_id", "employee_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_leave_request_status" ON "leave_requests" ("company_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_leave_request_dates" ON "leave_requests" ("employee_id", "start_date", "end_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_leave_request_type" ON "leave_requests" ("leave_type_id")`,
    );

    // ── leave_request_segments ──
    await queryRunner.query(`
      CREATE TABLE "leave_request_segments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "leave_request_id" uuid NOT NULL,
        "date" date NOT NULL,
        "session_type" varchar(20) NOT NULL DEFAULT 'full_day',
        "duration_days" decimal(4,2) NOT NULL DEFAULT 1,
        "counts_against_balance" boolean NOT NULL DEFAULT true,
        "applied_grant_id" uuid,
        CONSTRAINT "PK_leave_request_segments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_segment_request" FOREIGN KEY ("leave_request_id") REFERENCES "leave_requests"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_segment_grant" FOREIGN KEY ("applied_grant_id") REFERENCES "leave_grants"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_segment_request" ON "leave_request_segments" ("leave_request_id")`,
    );

    // ── Add FK from ledger to requests (now that requests table exists) ──
    await queryRunner.query(`
      ALTER TABLE "leave_balance_ledger"
      ADD CONSTRAINT "FK_ledger_request" FOREIGN KEY ("leave_request_id") REFERENCES "leave_requests"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "leave_balance_ledger" DROP CONSTRAINT IF EXISTS "FK_ledger_request"`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "leave_request_segments" CASCADE`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "leave_requests" CASCADE`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "leave_balance_ledger" CASCADE`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "leave_grants" CASCADE`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "leave_entitlement_rules" CASCADE`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "leave_policies" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "leave_types" CASCADE`);
  }
}
