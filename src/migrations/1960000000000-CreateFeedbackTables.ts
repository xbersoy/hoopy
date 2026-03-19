import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFeedbackTables1960000000000 implements MigrationInterface {
  name = 'CreateFeedbackTables1960000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── feedback_categories ──
    await queryRunner.query(`
      CREATE TABLE "feedback_categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "code" varchar(50) NOT NULL,
        "name" varchar(100) NOT NULL,
        "description" text,
        "icon" varchar(50),
        "color" varchar(20),
        "default_sensitivity" varchar(20) NOT NULL DEFAULT 'normal',
        "is_system" boolean NOT NULL DEFAULT false,
        "allow_anonymous" boolean NOT NULL DEFAULT true,
        "is_active" boolean NOT NULL DEFAULT true,
        "sort_order" int NOT NULL DEFAULT 0,
        "routing_rules" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_feedback_categories" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_feedback_category_company_code" UNIQUE ("company_id", "code"),
        CONSTRAINT "FK_feedback_category_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_feedback_category_company" ON "feedback_categories" ("company_id")`,
    );

    // ── feedback_items ──
    await queryRunner.query(`
      CREATE TABLE "feedback_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "category_id" uuid NOT NULL,
        "subject" varchar(255) NOT NULL,
        "body" text NOT NULL,
        "submission_mode" varchar(20) NOT NULL DEFAULT 'identified',
        "status" varchar(30) NOT NULL DEFAULT 'submitted',
        "sensitivity" varchar(20) NOT NULL DEFAULT 'normal',
        "submitted_by_id" uuid,
        "assigned_to_user_id" uuid,
        "resolution_notes" text,
        "feedback_request_id" uuid,
        "metadata" jsonb,
        "resolved_at" TIMESTAMP WITH TIME ZONE,
        "closed_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_feedback_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_feedback_item_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_feedback_item_category" FOREIGN KEY ("category_id") REFERENCES "feedback_categories"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_feedback_item_submitted_by" FOREIGN KEY ("submitted_by_id") REFERENCES "employees"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_feedback_item_assigned_to_user" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_feedback_item_company" ON "feedback_items" ("company_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_feedback_item_category" ON "feedback_items" ("category_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_feedback_item_status" ON "feedback_items" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_feedback_item_submitted_by" ON "feedback_items" ("submitted_by_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_feedback_item_assigned_to" ON "feedback_items" ("assigned_to_user_id")`,
    );

    // ── feedback_messages ──
    await queryRunner.query(`
      CREATE TABLE "feedback_messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "feedback_item_id" uuid NOT NULL,
        "content" text NOT NULL,
        "is_internal" boolean NOT NULL DEFAULT false,
        "sender_type" varchar(20) NOT NULL,
        "sender_id" uuid,
        "attachments" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_feedback_messages" PRIMARY KEY ("id"),
        CONSTRAINT "FK_feedback_message_item" FOREIGN KEY ("feedback_item_id") REFERENCES "feedback_items"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_feedback_message_item" ON "feedback_messages" ("feedback_item_id")`,
    );

    // ── feedback_request_templates ──
    await queryRunner.query(`
      CREATE TABLE "feedback_request_templates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "name" varchar(200) NOT NULL,
        "description" text,
        "default_title" varchar(255),
        "default_instructions" text,
        "default_category_id" uuid,
        "default_submission_mode" varchar(20) NOT NULL DEFAULT 'identified',
        "default_due_days" int,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_feedback_request_templates" PRIMARY KEY ("id"),
        CONSTRAINT "FK_feedback_request_template_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_feedback_request_template_category" FOREIGN KEY ("default_category_id") REFERENCES "feedback_categories"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_feedback_request_template_company" ON "feedback_request_templates" ("company_id")`,
    );

    // ── feedback_requests ──
    await queryRunner.query(`
      CREATE TABLE "feedback_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "title" varchar(255) NOT NULL,
        "instructions" text,
        "category_id" uuid,
        "template_id" uuid,
        "submission_mode" varchar(20) NOT NULL DEFAULT 'identified',
        "status" varchar(30) NOT NULL DEFAULT 'draft',
        "is_mandatory" boolean NOT NULL DEFAULT false,
        "due_date" date,
        "audience_type" varchar(50) NOT NULL DEFAULT 'all',
        "audience_config" jsonb,
        "reminder_settings" jsonb,
        "created_by_user_id" uuid,
        "activated_at" TIMESTAMP WITH TIME ZONE,
        "closed_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_feedback_requests" PRIMARY KEY ("id"),
        CONSTRAINT "FK_feedback_request_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_feedback_request_category" FOREIGN KEY ("category_id") REFERENCES "feedback_categories"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_feedback_request_template" FOREIGN KEY ("template_id") REFERENCES "feedback_request_templates"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_feedback_request_created_by" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_feedback_request_company" ON "feedback_requests" ("company_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_feedback_request_status" ON "feedback_requests" ("status")`,
    );

    // ── feedback_request_assignments ──
    await queryRunner.query(`
      CREATE TABLE "feedback_request_assignments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "feedback_request_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "status" varchar(30) NOT NULL DEFAULT 'pending',
        "feedback_item_id" uuid,
        "completed_at" TIMESTAMP WITH TIME ZONE,
        "last_reminder_at" TIMESTAMP WITH TIME ZONE,
        "reminder_count" int NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_feedback_request_assignments" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_feedback_assignment_request_employee" UNIQUE ("feedback_request_id", "employee_id"),
        CONSTRAINT "FK_feedback_request_assignment_request" FOREIGN KEY ("feedback_request_id") REFERENCES "feedback_requests"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_feedback_request_assignment_employee" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_feedback_request_assignment_feedback" FOREIGN KEY ("feedback_item_id") REFERENCES "feedback_items"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_feedback_assignment_request" ON "feedback_request_assignments" ("feedback_request_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_feedback_request_assignment_employee" ON "feedback_request_assignments" ("employee_id")`,
    );

    // ── survey_templates ──
    await queryRunner.query(`
      CREATE TABLE "survey_templates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "name" varchar(200) NOT NULL,
        "description" text,
        "default_title" varchar(255),
        "default_instructions" text,
        "default_anonymous" boolean NOT NULL DEFAULT true,
        "is_active" boolean NOT NULL DEFAULT true,
        "category" varchar(100),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_survey_templates" PRIMARY KEY ("id"),
        CONSTRAINT "FK_survey_template_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_survey_template_company" ON "survey_templates" ("company_id")`,
    );

    // ── surveys ──
    await queryRunner.query(`
      CREATE TABLE "surveys" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "template_id" uuid,
        "title" varchar(255) NOT NULL,
        "description" text,
        "status" varchar(30) NOT NULL DEFAULT 'draft',
        "is_anonymous" boolean NOT NULL DEFAULT true,
        "is_mandatory" boolean NOT NULL DEFAULT false,
        "allow_edit_until_due" boolean NOT NULL DEFAULT false,
        "start_date" date,
        "due_date" date,
        "close_date" date,
        "scheduled_publish_at" TIMESTAMP WITH TIME ZONE,
        "published_at" TIMESTAMP WITH TIME ZONE,
        "closed_at" TIMESTAMP WITH TIME ZONE,
        "recurrence" varchar(30) NOT NULL DEFAULT 'once',
        "audience_type" varchar(50) NOT NULL DEFAULT 'all',
        "audience_config" jsonb,
        "reminder_settings" jsonb,
        "anonymity_threshold" int NOT NULL DEFAULT 5,
        "created_by_user_id" uuid,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_surveys" PRIMARY KEY ("id"),
        CONSTRAINT "FK_survey_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_survey_template" FOREIGN KEY ("template_id") REFERENCES "survey_templates"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_survey_created_by" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_survey_company" ON "surveys" ("company_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_survey_status" ON "surveys" ("status")`,
    );

    // ── survey_questions ──
    await queryRunner.query(`
      CREATE TABLE "survey_questions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "survey_id" uuid,
        "survey_template_id" uuid,
        "section" varchar(200),
        "question_text" text NOT NULL,
        "help_text" text,
        "question_type" varchar(30) NOT NULL,
        "is_required" boolean NOT NULL DEFAULT false,
        "sort_order" int NOT NULL DEFAULT 0,
        "config" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_survey_questions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_survey_question_survey" FOREIGN KEY ("survey_id") REFERENCES "surveys"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_survey_question_template" FOREIGN KEY ("survey_template_id") REFERENCES "survey_templates"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_survey_question_survey" ON "survey_questions" ("survey_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_survey_question_template" ON "survey_questions" ("survey_template_id")`,
    );

    // ── survey_question_options ──
    await queryRunner.query(`
      CREATE TABLE "survey_question_options" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "question_id" uuid NOT NULL,
        "value" varchar(255) NOT NULL,
        "label" varchar(255) NOT NULL,
        "sort_order" int NOT NULL DEFAULT 0,
        CONSTRAINT "PK_survey_question_options" PRIMARY KEY ("id"),
        CONSTRAINT "FK_survey_question_option_question" FOREIGN KEY ("question_id") REFERENCES "survey_questions"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_survey_question_option_question" ON "survey_question_options" ("question_id")`,
    );

    // ── survey_assignments ──
    await queryRunner.query(`
      CREATE TABLE "survey_assignments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "survey_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "status" varchar(30) NOT NULL DEFAULT 'not_started',
        "has_completed" boolean NOT NULL DEFAULT false,
        "started_at" TIMESTAMP WITH TIME ZONE,
        "completed_at" TIMESTAMP WITH TIME ZONE,
        "last_reminder_at" TIMESTAMP WITH TIME ZONE,
        "reminder_count" int NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_survey_assignments" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_survey_assignment_survey_employee" UNIQUE ("survey_id", "employee_id"),
        CONSTRAINT "FK_survey_assignment_survey" FOREIGN KEY ("survey_id") REFERENCES "surveys"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_survey_assignment_employee" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_survey_assignment_survey" ON "survey_assignments" ("survey_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_survey_assignment_employee" ON "survey_assignments" ("employee_id")`,
    );

    // ── survey_responses ──
    await queryRunner.query(`
      CREATE TABLE "survey_responses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "survey_id" uuid NOT NULL,
        "respondent_id" uuid,
        "status" varchar(30) NOT NULL DEFAULT 'in_progress',
        "submitted_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_survey_responses" PRIMARY KEY ("id"),
        CONSTRAINT "FK_survey_response_survey" FOREIGN KEY ("survey_id") REFERENCES "surveys"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_survey_response_respondent" FOREIGN KEY ("respondent_id") REFERENCES "employees"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_survey_response_survey" ON "survey_responses" ("survey_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_survey_response_respondent" ON "survey_responses" ("respondent_id")`,
    );

    // ── survey_answers ──
    await queryRunner.query(`
      CREATE TABLE "survey_answers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "response_id" uuid NOT NULL,
        "question_id" uuid NOT NULL,
        "text_value" text,
        "numeric_value" int,
        "selected_option_id" uuid,
        "selected_option_ids" jsonb,
        "boolean_value" boolean,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_survey_answers" PRIMARY KEY ("id"),
        CONSTRAINT "FK_survey_answer_response" FOREIGN KEY ("response_id") REFERENCES "survey_responses"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_survey_answer_question" FOREIGN KEY ("question_id") REFERENCES "survey_questions"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_survey_answer_response" ON "survey_answers" ("response_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_survey_answer_question" ON "survey_answers" ("question_id")`,
    );

    // ── announcements ──
    await queryRunner.query(`
      CREATE TABLE "announcements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "title" varchar(255) NOT NULL,
        "summary" varchar(500),
        "body" text NOT NULL,
        "status" varchar(30) NOT NULL DEFAULT 'draft',
        "priority" varchar(20) NOT NULL DEFAULT 'normal',
        "is_pinned" boolean NOT NULL DEFAULT false,
        "requires_acknowledgment" boolean NOT NULL DEFAULT false,
        "acknowledgment_due_date" date,
        "scheduled_publish_at" TIMESTAMP WITH TIME ZONE,
        "published_at" TIMESTAMP WITH TIME ZONE,
        "expires_at" date,
        "audience_type" varchar(50) NOT NULL DEFAULT 'all',
        "audience_config" jsonb,
        "attachments" jsonb,
        "created_by_user_id" uuid,
        "archived_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_announcements" PRIMARY KEY ("id"),
        CONSTRAINT "FK_announcement_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_announcement_created_by" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_announcement_company" ON "announcements" ("company_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_announcement_status" ON "announcements" ("status")`,
    );

    // ── announcement_recipients ──
    await queryRunner.query(`
      CREATE TABLE "announcement_recipients" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "announcement_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "has_read" boolean NOT NULL DEFAULT false,
        "read_at" TIMESTAMP WITH TIME ZONE,
        "has_acknowledged" boolean NOT NULL DEFAULT false,
        "acknowledged_at" TIMESTAMP WITH TIME ZONE,
        "last_reminder_at" TIMESTAMP WITH TIME ZONE,
        "reminder_count" int NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_announcement_recipients" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_announcement_recipient" UNIQUE ("announcement_id", "employee_id"),
        CONSTRAINT "FK_announcement_recipient_announcement" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_announcement_recipient_employee" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_announcement_recipient_announcement" ON "announcement_recipients" ("announcement_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_announcement_recipient_employee" ON "announcement_recipients" ("employee_id")`,
    );

    // ── Add deferred FK for feedback_items -> feedback_requests ──
    await queryRunner.query(
      `ALTER TABLE "feedback_items" ADD CONSTRAINT "FK_feedback_item_request" FOREIGN KEY ("feedback_request_id") REFERENCES "feedback_requests"("id") ON DELETE SET NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop in reverse order of creation
    await queryRunner.query(`DROP TABLE IF EXISTS "announcement_recipients"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "announcements"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "survey_answers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "survey_responses"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "survey_assignments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "survey_question_options"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "survey_questions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "surveys"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "survey_templates"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "feedback_request_assignments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "feedback_requests"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "feedback_request_templates"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "feedback_messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "feedback_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "feedback_categories"`);
  }
}
