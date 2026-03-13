import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCustomObjectsTables1900000000000
  implements MigrationInterface
{
  name = 'CreateCustomObjectsTables1900000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. custom_object_definitions
    await queryRunner.query(`
      CREATE TABLE "custom_object_definitions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "code" character varying(100) NOT NULL,
        "label" character varying(255) NOT NULL,
        "description" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_by" uuid,
        "updated_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_custom_object_definitions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_cod_company_code" UNIQUE ("company_id", "code"),
        CONSTRAINT "FK_cod_company" FOREIGN KEY ("company_id")
          REFERENCES "companies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_cod_created_by" FOREIGN KEY ("created_by")
          REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_cod_updated_by" FOREIGN KEY ("updated_by")
          REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_cod_company_id" ON "custom_object_definitions" ("company_id")`,
    );

    // 2. custom_object_fields
    await queryRunner.query(`
      CREATE TABLE "custom_object_fields" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "definition_id" uuid NOT NULL,
        "code" character varying(100) NOT NULL,
        "label" character varying(255) NOT NULL,
        "description" text,
        "data_type" character varying(20) NOT NULL,
        "is_required" boolean NOT NULL DEFAULT false,
        "sort_order" integer NOT NULL DEFAULT 0,
        "options" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_custom_object_fields" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_cof_definition_code" UNIQUE ("definition_id", "code"),
        CONSTRAINT "FK_cof_definition" FOREIGN KEY ("definition_id")
          REFERENCES "custom_object_definitions"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_cof_definition_id" ON "custom_object_fields" ("definition_id")`,
    );

    // 3. custom_object_records
    await queryRunner.query(`
      CREATE TABLE "custom_object_records" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "definition_id" uuid NOT NULL,
        "company_id" uuid NOT NULL,
        "data" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_by" uuid,
        "updated_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_custom_object_records" PRIMARY KEY ("id"),
        CONSTRAINT "FK_cor_definition" FOREIGN KEY ("definition_id")
          REFERENCES "custom_object_definitions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_cor_company" FOREIGN KEY ("company_id")
          REFERENCES "companies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_cor_created_by" FOREIGN KEY ("created_by")
          REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_cor_updated_by" FOREIGN KEY ("updated_by")
          REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_cor_definition_id" ON "custom_object_records" ("definition_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cor_company_id" ON "custom_object_records" ("company_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "custom_object_records"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "custom_object_fields"`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "custom_object_definitions"`,
    );
  }
}
