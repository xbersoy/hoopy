import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkflowTables1910000000000 implements MigrationInterface {
  name = 'CreateWorkflowTables1910000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── workflow_definitions ───
    await queryRunner.query(`
      CREATE TABLE "workflow_definitions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "name" varchar NOT NULL,
        "code" varchar NOT NULL,
        "description" text,
        "resource_type" varchar NOT NULL,
        "category" varchar,
        "is_active" boolean NOT NULL DEFAULT true,
        "priority" int NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_workflow_definitions" PRIMARY KEY ("id"),
        CONSTRAINT "fk_workflow_definitions_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE,
        CONSTRAINT "uq_workflow_definitions_company_code" UNIQUE ("company_id", "code")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_workflow_definitions_company" ON "workflow_definitions" ("company_id")
    `);

    // ─── workflow_definition_versions ───
    await queryRunner.query(`
      CREATE TABLE "workflow_definition_versions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "definition_id" uuid NOT NULL,
        "version" int NOT NULL,
        "status" varchar NOT NULL DEFAULT 'draft',
        "trigger_mode" varchar NOT NULL DEFAULT 'manual',
        "entry_criteria" jsonb,
        "notification_config" jsonb,
        "sla_config" jsonb,
        "behavior_config" jsonb,
        "change_notes" text,
        "published_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_workflow_definition_versions" PRIMARY KEY ("id"),
        CONSTRAINT "fk_workflow_definition_versions_definition" FOREIGN KEY ("definition_id") REFERENCES "workflow_definitions"("id") ON DELETE CASCADE,
        CONSTRAINT "uq_workflow_definition_versions_def_ver" UNIQUE ("definition_id", "version")
      )
    `);

    // ─── workflow_step_definitions ───
    await queryRunner.query(`
      CREATE TABLE "workflow_step_definitions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "version_id" uuid NOT NULL,
        "name" varchar NOT NULL,
        "code" varchar NOT NULL,
        "type" varchar NOT NULL DEFAULT 'approval',
        "sort_order" int NOT NULL,
        "assignee_strategy" varchar NOT NULL,
        "assignee_config" jsonb,
        "approval_strategy" varchar NOT NULL DEFAULT 'any',
        "entry_condition" jsonb,
        "sla_duration_hours" int,
        "escalation_config" jsonb,
        "is_comment_required" boolean NOT NULL DEFAULT false,
        "is_attachment_required" boolean NOT NULL DEFAULT false,
        "is_skippable" boolean NOT NULL DEFAULT false,
        "is_auto_complete" boolean NOT NULL DEFAULT false,
        "auto_complete_condition" jsonb,
        "form_config" jsonb,
        "metadata" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_workflow_step_definitions" PRIMARY KEY ("id"),
        CONSTRAINT "fk_workflow_step_definitions_version" FOREIGN KEY ("version_id") REFERENCES "workflow_definition_versions"("id") ON DELETE CASCADE,
        CONSTRAINT "uq_workflow_step_definitions_version_code" UNIQUE ("version_id", "code")
      )
    `);

    // ─── workflow_transition_definitions ───
    await queryRunner.query(`
      CREATE TABLE "workflow_transition_definitions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "version_id" uuid NOT NULL,
        "from_step_id" uuid NOT NULL,
        "to_step_id" uuid,
        "action" varchar NOT NULL,
        "condition" jsonb,
        "priority" int NOT NULL DEFAULT 0,
        "is_default" boolean NOT NULL DEFAULT false,
        "label" varchar,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_workflow_transition_definitions" PRIMARY KEY ("id"),
        CONSTRAINT "fk_workflow_transition_definitions_version" FOREIGN KEY ("version_id") REFERENCES "workflow_definition_versions"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_workflow_transition_definitions_from_step" FOREIGN KEY ("from_step_id") REFERENCES "workflow_step_definitions"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_workflow_transition_definitions_to_step" FOREIGN KEY ("to_step_id") REFERENCES "workflow_step_definitions"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_workflow_transition_definitions_unique"
      ON "workflow_transition_definitions" ("version_id", "from_step_id", "action", "priority")
    `);

    // ─── workflow_instances ───
    await queryRunner.query(`
      CREATE TABLE "workflow_instances" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "version_id" uuid NOT NULL,
        "resource_type" varchar NOT NULL,
        "resource_id" uuid NOT NULL,
        "initiator_id" uuid NOT NULL,
        "subject_id" uuid,
        "status" varchar NOT NULL DEFAULT 'pending',
        "current_step_id" uuid,
        "context_snapshot" jsonb,
        "definition_snapshot" jsonb,
        "due_date" TIMESTAMP WITH TIME ZONE,
        "completed_at" TIMESTAMP WITH TIME ZONE,
        "metadata" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_workflow_instances" PRIMARY KEY ("id"),
        CONSTRAINT "fk_workflow_instances_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_workflow_instances_version" FOREIGN KEY ("version_id") REFERENCES "workflow_definition_versions"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_workflow_instances_company_resource"
      ON "workflow_instances" ("company_id", "resource_type", "resource_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_workflow_instances_company_status"
      ON "workflow_instances" ("company_id", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_workflow_instances_initiator"
      ON "workflow_instances" ("initiator_id")
    `);

    // ─── workflow_step_instances ───
    await queryRunner.query(`
      CREATE TABLE "workflow_step_instances" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "instance_id" uuid NOT NULL,
        "step_definition_id" uuid NOT NULL,
        "name" varchar NOT NULL,
        "code" varchar NOT NULL,
        "type" varchar NOT NULL,
        "sort_order" int NOT NULL,
        "approval_strategy" varchar NOT NULL DEFAULT 'any',
        "status" varchar NOT NULL DEFAULT 'pending',
        "activated_at" TIMESTAMP WITH TIME ZONE,
        "completed_at" TIMESTAMP WITH TIME ZONE,
        "due_date" TIMESTAMP WITH TIME ZONE,
        "is_comment_required" boolean NOT NULL DEFAULT false,
        "is_attachment_required" boolean NOT NULL DEFAULT false,
        "is_skippable" boolean NOT NULL DEFAULT false,
        "decision" varchar,
        "comment" text,
        "metadata" jsonb,
        "definition_snapshot" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_workflow_step_instances" PRIMARY KEY ("id"),
        CONSTRAINT "fk_workflow_step_instances_instance" FOREIGN KEY ("instance_id") REFERENCES "workflow_instances"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_workflow_step_instances_instance_status"
      ON "workflow_step_instances" ("instance_id", "status")
    `);

    // ─── workflow_step_assignees ───
    await queryRunner.query(`
      CREATE TABLE "workflow_step_assignees" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "step_instance_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "resolved_via" varchar NOT NULL,
        "has_acted" boolean NOT NULL DEFAULT false,
        "decision" varchar,
        "comment" text,
        "acted_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_workflow_step_assignees" PRIMARY KEY ("id"),
        CONSTRAINT "fk_workflow_step_assignees_step_instance" FOREIGN KEY ("step_instance_id") REFERENCES "workflow_step_instances"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_workflow_step_assignees_user"
      ON "workflow_step_assignees" ("user_id", "has_acted")
    `);

    // ─── workflow_action_logs ───
    await queryRunner.query(`
      CREATE TABLE "workflow_action_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "instance_id" uuid NOT NULL,
        "step_instance_id" uuid,
        "action" varchar NOT NULL,
        "actor_id" uuid,
        "from_status" varchar,
        "to_status" varchar,
        "comment" text,
        "metadata" jsonb,
        "ip_address" varchar,
        "user_agent" varchar,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_workflow_action_logs" PRIMARY KEY ("id"),
        CONSTRAINT "fk_workflow_action_logs_instance" FOREIGN KEY ("instance_id") REFERENCES "workflow_instances"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_workflow_action_logs_instance_created"
      ON "workflow_action_logs" ("instance_id", "created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "workflow_action_logs" CASCADE`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "workflow_step_assignees" CASCADE`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "workflow_step_instances" CASCADE`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "workflow_instances" CASCADE`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "workflow_transition_definitions" CASCADE`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "workflow_step_definitions" CASCADE`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "workflow_definition_versions" CASCADE`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "workflow_definitions" CASCADE`,
    );
  }
}
