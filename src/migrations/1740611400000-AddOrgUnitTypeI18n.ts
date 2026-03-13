import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrgUnitTypeI18n1740611400000 implements MigrationInterface {
  name = 'AddOrgUnitTypeI18n1740611400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Create i18n table ───────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "org_unit_type_i18n" (
        "id"                uuid DEFAULT uuid_generate_v4() NOT NULL,
        "company_id"        uuid NOT NULL,
        "org_unit_type_id"  uuid NOT NULL,
        "locale"            varchar(35) NOT NULL,
        "name"              varchar(255) NOT NULL,
        "short_name"        varchar(100),
        "description"       text,
        "created_at"        TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"        TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_org_unit_type_i18n" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_org_unit_type_i18n_type_locale" UNIQUE ("org_unit_type_id", "locale"),
        CONSTRAINT "FK_org_unit_type_i18n_company" FOREIGN KEY ("company_id")
          REFERENCES "companies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_org_unit_type_i18n_type" FOREIGN KEY ("org_unit_type_id")
          REFERENCES "org_unit_types"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_org_unit_type_i18n_company_locale"
        ON "org_unit_type_i18n" ("company_id", "locale")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_org_unit_type_i18n_company_type"
        ON "org_unit_type_i18n" ("company_id", "org_unit_type_id")
    `);

    // ── Migrate existing name data into i18n as 'en' ────────────
    await queryRunner.query(`
      INSERT INTO "org_unit_type_i18n" ("company_id", "org_unit_type_id", "locale", "name")
      SELECT "company_id", "id", 'en', "name"
      FROM "org_unit_types"
      WHERE "name" IS NOT NULL
    `);

    // ── Drop name column from org_unit_types ────────────────────
    await queryRunner.query(`
      ALTER TABLE "org_unit_types" DROP COLUMN "name"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ── Re-add name column ──────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "org_unit_types"
      ADD COLUMN "name" varchar(255)
    `);

    // ── Backfill name from 'en' i18n rows ───────────────────────
    await queryRunner.query(`
      UPDATE "org_unit_types" t
      SET "name" = i."name"
      FROM "org_unit_type_i18n" i
      WHERE i."org_unit_type_id" = t."id" AND i."locale" = 'en'
    `);

    // ── Set name NOT NULL and default for any remaining nulls ───
    await queryRunner.query(`
      UPDATE "org_unit_types" SET "name" = "slug" WHERE "name" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "org_unit_types" ALTER COLUMN "name" SET NOT NULL
    `);

    // ── Drop i18n table ─────────────────────────────────────────
    await queryRunner.query(`DROP TABLE IF EXISTS "org_unit_type_i18n"`);
  }
}
