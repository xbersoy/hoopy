import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPicklistsAndAdvancedCustomFields1900000000002 implements MigrationInterface {
  name = 'AddPicklistsAndAdvancedCustomFields1900000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create Picklists tables
    await queryRunner.query(`
      CREATE TABLE "picklists" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "code" character varying(100) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_picklist_company_code" UNIQUE ("company_id", "code"),
        CONSTRAINT "PK_picklists" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "picklist_i18n" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "picklist_id" uuid NOT NULL,
        "locale" character varying(35) NOT NULL,
        "name" character varying(255) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_picklist_i18n_picklist_locale" UNIQUE ("picklist_id", "locale"),
        CONSTRAINT "PK_picklist_i18n" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "picklist_options" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "picklist_id" uuid NOT NULL,
        "code" character varying(100) NOT NULL,
        "sort_order" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_picklist_option_picklist_code" UNIQUE ("picklist_id", "code"),
        CONSTRAINT "PK_picklist_options" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "picklist_option_i18n" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "picklist_option_id" uuid NOT NULL,
        "locale" character varying(35) NOT NULL,
        "label" character varying(255) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_picklist_option_i18n_option_locale" UNIQUE ("picklist_option_id", "locale"),
        CONSTRAINT "PK_picklist_option_i18n" PRIMARY KEY ("id")
      )
    `);

    // 1B. Create Custom Objects I18n tables
    await queryRunner.query(`
      CREATE TABLE "custom_object_definition_i18n" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "definition_id" uuid NOT NULL,
        "locale" character varying(35) NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text,
        "plural_name" character varying(255),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_cod_i18n_definition_locale" UNIQUE ("definition_id", "locale"),
        CONSTRAINT "PK_custom_object_definition_i18n" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "custom_object_field_i18n" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "field_id" uuid NOT NULL,
        "locale" character varying(35) NOT NULL,
        "label" character varying(255) NOT NULL,
        "description" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_cof_i18n_field_locale" UNIQUE ("field_id", "locale"),
        CONSTRAINT "PK_custom_object_field_i18n" PRIMARY KEY ("id")
      )
    `);

    // 2. Add Foreign Keys for Picklists
    await queryRunner.query(`ALTER TABLE "picklists" ADD CONSTRAINT "FK_picklists_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "picklist_i18n" ADD CONSTRAINT "FK_picklist_i18n_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "picklist_i18n" ADD CONSTRAINT "FK_picklist_i18n_picklist" FOREIGN KEY ("picklist_id") REFERENCES "picklists"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "picklist_options" ADD CONSTRAINT "FK_picklist_options_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "picklist_options" ADD CONSTRAINT "FK_picklist_options_picklist" FOREIGN KEY ("picklist_id") REFERENCES "picklists"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "picklist_option_i18n" ADD CONSTRAINT "FK_picklist_option_i18n_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "picklist_option_i18n" ADD CONSTRAINT "FK_picklist_option_i18n_option" FOREIGN KEY ("picklist_option_id") REFERENCES "picklist_options"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

    await queryRunner.query(`ALTER TABLE "custom_object_definition_i18n" ADD CONSTRAINT "FK_cod_i18n_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "custom_object_definition_i18n" ADD CONSTRAINT "FK_cod_i18n_definition" FOREIGN KEY ("definition_id") REFERENCES "custom_object_definitions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "custom_object_field_i18n" ADD CONSTRAINT "FK_cof_i18n_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "custom_object_field_i18n" ADD CONSTRAINT "FK_cof_i18n_field" FOREIGN KEY ("field_id") REFERENCES "custom_object_fields"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

    // Indexes
    await queryRunner.query(`CREATE INDEX "IDX_picklist_i18n_company_locale" ON "picklist_i18n" ("company_id", "locale")`);
    await queryRunner.query(`CREATE INDEX "IDX_picklist_opt_i18n_company_locale" ON "picklist_option_i18n" ("company_id", "locale")`);
    await queryRunner.query(`CREATE INDEX "IDX_cod_i18n_company_locale" ON "custom_object_definition_i18n" ("company_id", "locale")`);
    await queryRunner.query(`CREATE INDEX "IDX_cof_i18n_company_locale" ON "custom_object_field_i18n" ("company_id", "locale")`);

    // 3. Add Advanced Columns to CustomObjectField
    await queryRunner.query(`ALTER TABLE "custom_object_fields" ADD "picklist_id" uuid`);
    await queryRunner.query(`ALTER TABLE "custom_object_fields" ADD "referenced_definition_id" uuid`);
    await queryRunner.query(`ALTER TABLE "custom_object_fields" ADD "read_permission_group_id" uuid`);
    await queryRunner.query(`ALTER TABLE "custom_object_fields" ADD "edit_permission_group_id" uuid`);

    // 4. Add Instance-Level RBP Columns to CustomObjectRecord
    await queryRunner.query(`ALTER TABLE "custom_object_records" ADD "owner_id" uuid`);
    await queryRunner.query(`ALTER TABLE "custom_object_records" ADD "owner_group_id" uuid`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 0. Remove Instance-Level RBP Columns from CustomObjectRecord
    await queryRunner.query(`ALTER TABLE "custom_object_records" DROP COLUMN "owner_group_id"`);
    await queryRunner.query(`ALTER TABLE "custom_object_records" DROP COLUMN "owner_id"`);

    // 1. Remove Advanced Columns from CustomObjectField
    await queryRunner.query(`ALTER TABLE "custom_object_fields" DROP COLUMN "edit_permission_group_id"`);
    await queryRunner.query(`ALTER TABLE "custom_object_fields" DROP COLUMN "read_permission_group_id"`);
    await queryRunner.query(`ALTER TABLE "custom_object_fields" DROP COLUMN "referenced_definition_id"`);
    await queryRunner.query(`ALTER TABLE "custom_object_fields" DROP COLUMN "picklist_id"`);

    // 2. Drop Foreign Keys for Picklists & Custom Objects I18n
    await queryRunner.query(`ALTER TABLE "custom_object_field_i18n" DROP CONSTRAINT "FK_cof_i18n_field"`);
    await queryRunner.query(`ALTER TABLE "custom_object_field_i18n" DROP CONSTRAINT "FK_cof_i18n_company"`);
    await queryRunner.query(`ALTER TABLE "custom_object_definition_i18n" DROP CONSTRAINT "FK_cod_i18n_definition"`);
    await queryRunner.query(`ALTER TABLE "custom_object_definition_i18n" DROP CONSTRAINT "FK_cod_i18n_company"`);
    await queryRunner.query(`ALTER TABLE "picklist_option_i18n" DROP CONSTRAINT "FK_picklist_option_i18n_option"`);
    await queryRunner.query(`ALTER TABLE "picklist_option_i18n" DROP CONSTRAINT "FK_picklist_option_i18n_company"`);
    await queryRunner.query(`ALTER TABLE "picklist_options" DROP CONSTRAINT "FK_picklist_options_picklist"`);
    await queryRunner.query(`ALTER TABLE "picklist_options" DROP CONSTRAINT "FK_picklist_options_company"`);
    await queryRunner.query(`ALTER TABLE "picklist_i18n" DROP CONSTRAINT "FK_picklist_i18n_picklist"`);
    await queryRunner.query(`ALTER TABLE "picklist_i18n" DROP CONSTRAINT "FK_picklist_i18n_company"`);
    await queryRunner.query(`ALTER TABLE "picklists" DROP CONSTRAINT "FK_picklists_company"`);

    // 3. Drop Picklists Tables
    await queryRunner.query(`DROP INDEX "public"."IDX_cof_i18n_company_locale"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cod_i18n_company_locale"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_picklist_opt_i18n_company_locale"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_picklist_i18n_company_locale"`);
    await queryRunner.query(`DROP TABLE "custom_object_field_i18n"`);
    await queryRunner.query(`DROP TABLE "custom_object_definition_i18n"`);
    await queryRunner.query(`DROP TABLE "picklist_option_i18n"`);
    await queryRunner.query(`DROP TABLE "picklist_options"`);
    await queryRunner.query(`DROP TABLE "picklist_i18n"`);
    await queryRunner.query(`DROP TABLE "picklists"`);
  }
}
