import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSkillsCompetenciesTables1950000000000 implements MigrationInterface {
  name = 'AddSkillsCompetenciesTables1950000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enum types
    await queryRunner.query(
      `CREATE TYPE "public"."employee_skills_proficiency_level_enum" AS ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."employee_competencies_assessment_source_enum" AS ENUM('HR', 'MANAGER', 'SELF', 'ADMIN')`,
    );

    // Skill Types table (catalog, Admin/HR managed)
    await queryRunner.query(`
      CREATE TABLE "skill_types" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "code" character varying,
        "name" character varying NOT NULL,
        "description" character varying,
        "is_active" boolean NOT NULL DEFAULT true,
        "sort_order" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_skill_types" PRIMARY KEY ("id")
      )
    `);

    // Skills table (catalog, belongs to skill type)
    await queryRunner.query(`
      CREATE TABLE "skills" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "skill_type_id" uuid NOT NULL,
        "code" character varying,
        "name" character varying NOT NULL,
        "description" character varying,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_skills" PRIMARY KEY ("id")
      )
    `);

    // Competencies table (catalog)
    await queryRunner.query(`
      CREATE TABLE "competencies" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "code" character varying,
        "name" character varying NOT NULL,
        "description" character varying,
        "category" character varying,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_competencies" PRIMARY KEY ("id")
      )
    `);

    // Employee Skills table
    await queryRunner.query(`
      CREATE TABLE "employee_skills" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "skill_id" uuid NOT NULL,
        "proficiency_level" "public"."employee_skills_proficiency_level_enum" NOT NULL,
        "years_of_experience" numeric(4,1),
        "last_used_at" date,
        "is_primary" boolean NOT NULL DEFAULT false,
        "is_verified" boolean NOT NULL DEFAULT false,
        "verified_by" uuid,
        "notes" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_employee_skills" PRIMARY KEY ("id")
      )
    `);

    // Employee Competencies table
    await queryRunner.query(`
      CREATE TABLE "employee_competencies" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "competency_id" uuid NOT NULL,
        "rating" integer NOT NULL,
        "assessment_source" "public"."employee_competencies_assessment_source_enum" NOT NULL,
        "assessed_at" date NOT NULL,
        "assessor_user_id" uuid,
        "notes" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_employee_competencies" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_employee_competencies_rating" CHECK ("rating" >= 1 AND "rating" <= 5)
      )
    `);

    // Unique indexes for catalog tables (name unique per company)
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_skill_types_company_name" ON "skill_types" ("company_id", LOWER("name"))
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_skills_company_name" ON "skills" ("company_id", LOWER("name"))
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_competencies_company_name" ON "competencies" ("company_id", LOWER("name"))
    `);

    // Unique indexes for employee-linked tables
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_employee_skills_employee_skill" ON "employee_skills" ("company_id", "employee_id", "skill_id")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_employee_competencies_employee_competency" ON "employee_competencies" ("company_id", "employee_id", "competency_id")
    `);

    // Foreign keys for skill_types
    await queryRunner.query(`
      ALTER TABLE "skill_types" ADD CONSTRAINT "FK_skill_types_company"
      FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Foreign keys for skills
    await queryRunner.query(`
      ALTER TABLE "skills" ADD CONSTRAINT "FK_skills_company"
      FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "skills" ADD CONSTRAINT "FK_skills_skill_type"
      FOREIGN KEY ("skill_type_id") REFERENCES "skill_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Foreign keys for competencies
    await queryRunner.query(`
      ALTER TABLE "competencies" ADD CONSTRAINT "FK_competencies_company"
      FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Foreign keys for employee_skills
    await queryRunner.query(`
      ALTER TABLE "employee_skills" ADD CONSTRAINT "FK_employee_skills_company"
      FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "employee_skills" ADD CONSTRAINT "FK_employee_skills_employee"
      FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "employee_skills" ADD CONSTRAINT "FK_employee_skills_skill"
      FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "employee_skills" ADD CONSTRAINT "FK_employee_skills_verified_by"
      FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // Foreign keys for employee_competencies
    await queryRunner.query(`
      ALTER TABLE "employee_competencies" ADD CONSTRAINT "FK_employee_competencies_company"
      FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "employee_competencies" ADD CONSTRAINT "FK_employee_competencies_employee"
      FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "employee_competencies" ADD CONSTRAINT "FK_employee_competencies_competency"
      FOREIGN KEY ("competency_id") REFERENCES "competencies"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "employee_competencies" ADD CONSTRAINT "FK_employee_competencies_assessor"
      FOREIGN KEY ("assessor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // Additional indexes for common queries
    await queryRunner.query(`
      CREATE INDEX "IDX_skills_skill_type" ON "skills" ("skill_type_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_employee_skills_employee" ON "employee_skills" ("employee_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_employee_competencies_employee" ON "employee_competencies" ("employee_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_employee_competencies_employee"`);
    await queryRunner.query(`DROP INDEX "IDX_employee_skills_employee"`);
    await queryRunner.query(`DROP INDEX "IDX_skills_skill_type"`);

    // Drop foreign keys for employee_competencies
    await queryRunner.query(
      `ALTER TABLE "employee_competencies" DROP CONSTRAINT "FK_employee_competencies_assessor"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_competencies" DROP CONSTRAINT "FK_employee_competencies_competency"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_competencies" DROP CONSTRAINT "FK_employee_competencies_employee"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_competencies" DROP CONSTRAINT "FK_employee_competencies_company"`,
    );

    // Drop foreign keys for employee_skills
    await queryRunner.query(
      `ALTER TABLE "employee_skills" DROP CONSTRAINT "FK_employee_skills_verified_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_skills" DROP CONSTRAINT "FK_employee_skills_skill"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_skills" DROP CONSTRAINT "FK_employee_skills_employee"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_skills" DROP CONSTRAINT "FK_employee_skills_company"`,
    );

    // Drop foreign keys for competencies
    await queryRunner.query(
      `ALTER TABLE "competencies" DROP CONSTRAINT "FK_competencies_company"`,
    );

    // Drop foreign keys for skills
    await queryRunner.query(
      `ALTER TABLE "skills" DROP CONSTRAINT "FK_skills_skill_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "skills" DROP CONSTRAINT "FK_skills_company"`,
    );

    // Drop foreign keys for skill_types
    await queryRunner.query(
      `ALTER TABLE "skill_types" DROP CONSTRAINT "FK_skill_types_company"`,
    );

    // Drop unique indexes
    await queryRunner.query(
      `DROP INDEX "UQ_employee_competencies_employee_competency"`,
    );
    await queryRunner.query(`DROP INDEX "UQ_employee_skills_employee_skill"`);
    await queryRunner.query(`DROP INDEX "UQ_competencies_company_name"`);
    await queryRunner.query(`DROP INDEX "UQ_skills_company_name"`);
    await queryRunner.query(`DROP INDEX "UQ_skill_types_company_name"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "employee_competencies"`);
    await queryRunner.query(`DROP TABLE "employee_skills"`);
    await queryRunner.query(`DROP TABLE "competencies"`);
    await queryRunner.query(`DROP TABLE "skills"`);
    await queryRunner.query(`DROP TABLE "skill_types"`);

    // Drop enum types
    await queryRunner.query(
      `DROP TYPE "public"."employee_competencies_assessment_source_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."employee_skills_proficiency_level_enum"`,
    );
  }
}
