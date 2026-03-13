import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSettingsToAccountAndCompany1772221750435 implements MigrationInterface {
  name = 'AddSettingsToAccountAndCompany1772221750435';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "org_unit_type_i18n" DROP CONSTRAINT "FK_org_unit_type_i18n_company"`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_unit_type_i18n" DROP CONSTRAINT "FK_org_unit_type_i18n_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_unit_types" DROP CONSTRAINT "FK_org_unit_type_company"`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_units" DROP CONSTRAINT "FK_org_unit_company"`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_units" DROP CONSTRAINT "FK_org_unit_parent"`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_units" DROP CONSTRAINT "FK_org_unit_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_unit_links" DROP CONSTRAINT "FK_org_unit_link_company"`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_unit_links" DROP CONSTRAINT "FK_org_unit_link_from"`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_unit_links" DROP CONSTRAINT "FK_org_unit_link_to"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_org_unit_type_company"`);
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD "settings" jsonb DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD "settings" jsonb DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."org_unit_status_enum" RENAME TO "org_unit_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."org_units_status_enum" AS ENUM('ACTIVE', 'INACTIVE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_units" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_units" ALTER COLUMN "status" TYPE "public"."org_units_status_enum" USING "status"::"text"::"public"."org_units_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_units" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'`,
    );
    await queryRunner.query(`DROP TYPE "public"."org_unit_status_enum_old"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_92b369ffdad21576c11b4c1035" ON "org_unit_types" ("company_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "org_unit_type_i18n" ADD CONSTRAINT "FK_71c1468af4790b41d7ea1a4fe77" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_unit_type_i18n" ADD CONSTRAINT "FK_25d5b74931077600b17126ef649" FOREIGN KEY ("org_unit_type_id") REFERENCES "org_unit_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_unit_types" ADD CONSTRAINT "FK_92b369ffdad21576c11b4c1035f" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_units" ADD CONSTRAINT "FK_7f7fcbd624b8d50937e65a7771b" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_units" ADD CONSTRAINT "FK_93e336d1c079edb2cecd9c8f599" FOREIGN KEY ("parent_id") REFERENCES "org_units"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_units" ADD CONSTRAINT "FK_9355ca625ab27df27bb0aed600e" FOREIGN KEY ("type_id") REFERENCES "org_unit_types"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_unit_links" ADD CONSTRAINT "FK_b7ba827c15a80f6f060834aa680" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_unit_links" ADD CONSTRAINT "FK_c471fcff1e38e0a3757dff78027" FOREIGN KEY ("from_org_unit_id") REFERENCES "org_units"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_unit_links" ADD CONSTRAINT "FK_fa41bb970b0418ed40e90b475e4" FOREIGN KEY ("to_org_unit_id") REFERENCES "org_units"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "org_unit_links" DROP CONSTRAINT "FK_fa41bb970b0418ed40e90b475e4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_unit_links" DROP CONSTRAINT "FK_c471fcff1e38e0a3757dff78027"`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_unit_links" DROP CONSTRAINT "FK_b7ba827c15a80f6f060834aa680"`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_units" DROP CONSTRAINT "FK_9355ca625ab27df27bb0aed600e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_units" DROP CONSTRAINT "FK_93e336d1c079edb2cecd9c8f599"`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_units" DROP CONSTRAINT "FK_7f7fcbd624b8d50937e65a7771b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_unit_types" DROP CONSTRAINT "FK_92b369ffdad21576c11b4c1035f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_unit_type_i18n" DROP CONSTRAINT "FK_25d5b74931077600b17126ef649"`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_unit_type_i18n" DROP CONSTRAINT "FK_71c1468af4790b41d7ea1a4fe77"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_92b369ffdad21576c11b4c1035"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."org_unit_status_enum_old" AS ENUM('ACTIVE', 'INACTIVE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_units" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_units" ALTER COLUMN "status" TYPE "public"."org_unit_status_enum_old" USING "status"::"text"::"public"."org_unit_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_units" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'`,
    );
    await queryRunner.query(`DROP TYPE "public"."org_units_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."org_unit_status_enum_old" RENAME TO "org_unit_status_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "settings"`);
    await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "settings"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_org_unit_type_company" ON "org_unit_types" ("company_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "org_unit_links" ADD CONSTRAINT "FK_org_unit_link_to" FOREIGN KEY ("to_org_unit_id") REFERENCES "org_units"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_unit_links" ADD CONSTRAINT "FK_org_unit_link_from" FOREIGN KEY ("from_org_unit_id") REFERENCES "org_units"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_unit_links" ADD CONSTRAINT "FK_org_unit_link_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_units" ADD CONSTRAINT "FK_org_unit_type" FOREIGN KEY ("type_id") REFERENCES "org_unit_types"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_units" ADD CONSTRAINT "FK_org_unit_parent" FOREIGN KEY ("parent_id") REFERENCES "org_units"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_units" ADD CONSTRAINT "FK_org_unit_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_unit_types" ADD CONSTRAINT "FK_org_unit_type_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_unit_type_i18n" ADD CONSTRAINT "FK_org_unit_type_i18n_type" FOREIGN KEY ("org_unit_type_id") REFERENCES "org_unit_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_unit_type_i18n" ADD CONSTRAINT "FK_org_unit_type_i18n_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
