import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStateMachineAndI18n1920000000000 implements MigrationInterface {
  name = 'AddStateMachineAndI18n1920000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ═══════════════════════════════════════════════════════════════
    //  1. STATE MACHINE TABLES
    // ═══════════════════════════════════════════════════════════════

    // ─── state_machine_definitions ───
    await queryRunner.query(`
      CREATE TABLE "state_machine_definitions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "code" varchar(255) NOT NULL,
        "resource_type" varchar(255) NOT NULL,
        "category" varchar(50) NOT NULL DEFAULT 'lifecycle',
        "status" varchar(50) NOT NULL DEFAULT 'draft',
        "version" int NOT NULL DEFAULT 1,
        "initial_state_code" varchar(255) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "metadata" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_state_machine_definitions" PRIMARY KEY ("id"),
        CONSTRAINT "fk_sm_definitions_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_sm_definition_company_code" UNIQUE ("company_id", "code")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_sm_definitions_company" ON "state_machine_definitions" ("company_id")
    `);

    // ─── state_machine_definition_i18n ───
    await queryRunner.query(`
      CREATE TABLE "state_machine_definition_i18n" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "definition_id" uuid NOT NULL,
        "locale" varchar(35) NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_sm_definition_i18n" PRIMARY KEY ("id"),
        CONSTRAINT "fk_sm_definition_i18n_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_sm_definition_i18n_definition" FOREIGN KEY ("definition_id") REFERENCES "state_machine_definitions"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_sm_definition_i18n_def_locale" UNIQUE ("definition_id", "locale")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_sm_definition_i18n_company_locale"
      ON "state_machine_definition_i18n" ("company_id", "locale")
    `);

    // ─── state_machine_states ───
    await queryRunner.query(`
      CREATE TABLE "state_machine_states" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "definition_id" uuid NOT NULL,
        "code" varchar(255) NOT NULL,
        "is_final" boolean NOT NULL DEFAULT false,
        "is_initial" boolean NOT NULL DEFAULT false,
        "sort_order" int NOT NULL DEFAULT 0,
        "color" varchar(50),
        "icon" varchar(100),
        "metadata" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_sm_states" PRIMARY KEY ("id"),
        CONSTRAINT "fk_sm_states_definition" FOREIGN KEY ("definition_id") REFERENCES "state_machine_definitions"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_sm_state_definition_code" UNIQUE ("definition_id", "code")
      )
    `);

    // ─── state_machine_state_i18n ───
    await queryRunner.query(`
      CREATE TABLE "state_machine_state_i18n" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "state_id" uuid NOT NULL,
        "locale" varchar(35) NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_sm_state_i18n" PRIMARY KEY ("id"),
        CONSTRAINT "fk_sm_state_i18n_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_sm_state_i18n_state" FOREIGN KEY ("state_id") REFERENCES "state_machine_states"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_sm_state_i18n_state_locale" UNIQUE ("state_id", "locale")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_sm_state_i18n_company_locale"
      ON "state_machine_state_i18n" ("company_id", "locale")
    `);

    // ─── state_machine_transitions ───
    await queryRunner.query(`
      CREATE TABLE "state_machine_transitions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "definition_id" uuid NOT NULL,
        "code" varchar(255) NOT NULL,
        "from_state_id" uuid NOT NULL,
        "to_state_id" uuid NOT NULL,
        "guard_condition" jsonb,
        "priority" int NOT NULL DEFAULT 0,
        "metadata" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_sm_transitions" PRIMARY KEY ("id"),
        CONSTRAINT "fk_sm_transitions_definition" FOREIGN KEY ("definition_id") REFERENCES "state_machine_definitions"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_sm_transitions_from_state" FOREIGN KEY ("from_state_id") REFERENCES "state_machine_states"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_sm_transitions_to_state" FOREIGN KEY ("to_state_id") REFERENCES "state_machine_states"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_sm_transition_definition_code" UNIQUE ("definition_id", "code")
      )
    `);

    // ─── state_machine_transition_i18n ───
    await queryRunner.query(`
      CREATE TABLE "state_machine_transition_i18n" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "transition_id" uuid NOT NULL,
        "locale" varchar(35) NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_sm_transition_i18n" PRIMARY KEY ("id"),
        CONSTRAINT "fk_sm_transition_i18n_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_sm_transition_i18n_transition" FOREIGN KEY ("transition_id") REFERENCES "state_machine_transitions"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_sm_transition_i18n_trans_locale" UNIQUE ("transition_id", "locale")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_sm_transition_i18n_company_locale"
      ON "state_machine_transition_i18n" ("company_id", "locale")
    `);

    // ─── state_machine_instances ───
    await queryRunner.query(`
      CREATE TABLE "state_machine_instances" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "definition_id" uuid NOT NULL,
        "resource_type" varchar(255) NOT NULL,
        "resource_id" uuid NOT NULL,
        "current_state_id" uuid NOT NULL,
        "is_completed" boolean NOT NULL DEFAULT false,
        "definition_version" int NOT NULL,
        "context" jsonb,
        "metadata" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_sm_instances" PRIMARY KEY ("id"),
        CONSTRAINT "fk_sm_instances_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_sm_instances_definition" FOREIGN KEY ("definition_id") REFERENCES "state_machine_definitions"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_sm_instances_current_state" FOREIGN KEY ("current_state_id") REFERENCES "state_machine_states"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_sm_instance_company_resource"
      ON "state_machine_instances" ("company_id", "resource_type", "resource_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_sm_instance_current_state"
      ON "state_machine_instances" ("company_id", "current_state_id")
    `);

    // ─── state_machine_transition_history ───
    await queryRunner.query(`
      CREATE TABLE "state_machine_transition_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "instance_id" uuid NOT NULL,
        "transition_id" uuid NOT NULL,
        "from_state_id" uuid NOT NULL,
        "to_state_id" uuid NOT NULL,
        "actor_id" uuid,
        "comment" text,
        "context_snapshot" jsonb,
        "metadata" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_sm_transition_history" PRIMARY KEY ("id"),
        CONSTRAINT "fk_sm_history_instance" FOREIGN KEY ("instance_id") REFERENCES "state_machine_instances"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_sm_history_transition" FOREIGN KEY ("transition_id") REFERENCES "state_machine_transitions"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_sm_history_from_state" FOREIGN KEY ("from_state_id") REFERENCES "state_machine_states"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_sm_history_to_state" FOREIGN KEY ("to_state_id") REFERENCES "state_machine_states"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_sm_history_instance_created"
      ON "state_machine_transition_history" ("instance_id", "created_at")
    `);

    // ═══════════════════════════════════════════════════════════════
    //  2. WORKFLOW TABLE MODIFICATIONS
    // ═══════════════════════════════════════════════════════════════

    // Add state_machine_definition_id to workflow_definitions
    await queryRunner.query(`
      ALTER TABLE "workflow_definitions"
      ADD COLUMN "state_machine_definition_id" uuid
    `);

    // Add foreign key (nullable initially for migration)
    await queryRunner.query(`
      ALTER TABLE "workflow_definitions"
      ADD CONSTRAINT "fk_workflow_definitions_sm_definition"
      FOREIGN KEY ("state_machine_definition_id") REFERENCES "state_machine_definitions"("id") ON DELETE RESTRICT
    `);

    // Add state_machine_instance_id to workflow_instances
    await queryRunner.query(`
      ALTER TABLE "workflow_instances"
      ADD COLUMN "state_machine_instance_id" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "workflow_instances"
      ADD CONSTRAINT "fk_workflow_instances_sm_instance"
      FOREIGN KEY ("state_machine_instance_id") REFERENCES "state_machine_instances"("id") ON DELETE RESTRICT
    `);

    // Add transition_code to workflow_step_definitions
    await queryRunner.query(`
      ALTER TABLE "workflow_step_definitions"
      ADD COLUMN "transition_code" varchar(255)
    `);

    // ═══════════════════════════════════════════════════════════════
    //  3. WORKFLOW I18N TABLES
    // ═══════════════════════════════════════════════════════════════

    // ─── workflow_definition_i18n ───
    await queryRunner.query(`
      CREATE TABLE "workflow_definition_i18n" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "definition_id" uuid NOT NULL,
        "locale" varchar(35) NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_wf_definition_i18n" PRIMARY KEY ("id"),
        CONSTRAINT "fk_wf_definition_i18n_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_wf_definition_i18n_definition" FOREIGN KEY ("definition_id") REFERENCES "workflow_definitions"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_wf_definition_i18n_def_locale" UNIQUE ("definition_id", "locale")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_wf_definition_i18n_company_locale"
      ON "workflow_definition_i18n" ("company_id", "locale")
    `);

    // ─── workflow_step_i18n ───
    await queryRunner.query(`
      CREATE TABLE "workflow_step_i18n" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "step_id" uuid NOT NULL,
        "locale" varchar(35) NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_wf_step_i18n" PRIMARY KEY ("id"),
        CONSTRAINT "fk_wf_step_i18n_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_wf_step_i18n_step" FOREIGN KEY ("step_id") REFERENCES "workflow_step_definitions"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_wf_step_i18n_step_locale" UNIQUE ("step_id", "locale")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_wf_step_i18n_company_locale"
      ON "workflow_step_i18n" ("company_id", "locale")
    `);

    // ═══════════════════════════════════════════════════════════════
    //  4. DATA MIGRATION: Migrate name/description → i18n tables
    // ═══════════════════════════════════════════════════════════════

    // Migrate workflow_definitions.name → workflow_definition_i18n
    await queryRunner.query(`
      INSERT INTO "workflow_definition_i18n" ("company_id", "definition_id", "locale", "name", "description")
      SELECT "company_id", "id", 'en', "name", "description"
      FROM "workflow_definitions"
      WHERE "name" IS NOT NULL
    `);

    // Migrate workflow_step_definitions.name → workflow_step_i18n
    // (steps don't have company_id directly, so we join through versions → definitions)
    await queryRunner.query(`
      INSERT INTO "workflow_step_i18n" ("company_id", "step_id", "locale", "name")
      SELECT wd."company_id", wsd."id", 'en', wsd."name"
      FROM "workflow_step_definitions" wsd
      JOIN "workflow_definition_versions" wdv ON wsd."version_id" = wdv."id"
      JOIN "workflow_definitions" wd ON wdv."definition_id" = wd."id"
      WHERE wsd."name" IS NOT NULL
    `);

    // Drop migrated columns from parent tables
    await queryRunner.query(
      `ALTER TABLE "workflow_definitions" DROP COLUMN IF EXISTS "name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_definitions" DROP COLUMN IF EXISTS "description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_step_definitions" DROP COLUMN IF EXISTS "name"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-add dropped columns
    await queryRunner.query(
      `ALTER TABLE "workflow_step_definitions" ADD COLUMN "name" varchar`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_definitions" ADD COLUMN "description" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_definitions" ADD COLUMN "name" varchar`,
    );

    // Restore data from i18n tables (English locale)
    await queryRunner.query(`
      UPDATE "workflow_definitions" wd
      SET "name" = i18n."name", "description" = i18n."description"
      FROM "workflow_definition_i18n" i18n
      WHERE i18n."definition_id" = wd."id" AND i18n."locale" = 'en'
    `);

    await queryRunner.query(`
      UPDATE "workflow_step_definitions" wsd
      SET "name" = i18n."name"
      FROM "workflow_step_i18n" i18n
      WHERE i18n."step_id" = wsd."id" AND i18n."locale" = 'en'
    `);

    // Drop i18n tables
    await queryRunner.query(
      `DROP TABLE IF EXISTS "workflow_step_i18n" CASCADE`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "workflow_definition_i18n" CASCADE`,
    );

    // Drop added columns from workflow tables
    await queryRunner.query(
      `ALTER TABLE "workflow_step_definitions" DROP COLUMN IF EXISTS "transition_code"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_instances" DROP CONSTRAINT IF EXISTS "fk_workflow_instances_sm_instance"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_instances" DROP COLUMN IF EXISTS "state_machine_instance_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_definitions" DROP CONSTRAINT IF EXISTS "fk_workflow_definitions_sm_definition"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_definitions" DROP COLUMN IF EXISTS "state_machine_definition_id"`,
    );

    // Drop state machine tables in reverse order
    await queryRunner.query(
      `DROP TABLE IF EXISTS "state_machine_transition_history" CASCADE`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "state_machine_instances" CASCADE`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "state_machine_transition_i18n" CASCADE`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "state_machine_transitions" CASCADE`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "state_machine_state_i18n" CASCADE`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "state_machine_states" CASCADE`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "state_machine_definition_i18n" CASCADE`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "state_machine_definitions" CASCADE`,
    );
  }
}
