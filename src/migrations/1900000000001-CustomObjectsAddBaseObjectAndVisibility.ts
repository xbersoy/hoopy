import { MigrationInterface, QueryRunner } from 'typeorm';

export class CustomObjectsAddBaseObjectAndVisibility1900000000001
  implements MigrationInterface {
  name = 'CustomObjectsAddBaseObjectAndVisibility1900000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add base_object_type to definitions
    await queryRunner.query(`
      ALTER TABLE "custom_object_definitions"
        ADD COLUMN "base_object_type" character varying(50)
    `);

    // Add visibility to fields
    await queryRunner.query(`
      ALTER TABLE "custom_object_fields"
        ADD COLUMN "visibility" character varying(10) NOT NULL DEFAULT 'EDIT'
    `);

    // Add base_object_id to records
    await queryRunner.query(`
      ALTER TABLE "custom_object_records"
        ADD COLUMN "base_object_id" uuid
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_cor_base_object_id" ON "custom_object_records" ("base_object_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_cor_base_object_id"`,
    );
    await queryRunner.query(`
      ALTER TABLE "custom_object_records"
        DROP COLUMN IF EXISTS "base_object_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "custom_object_fields"
        DROP COLUMN IF EXISTS "visibility"
    `);
    await queryRunner.query(`
      ALTER TABLE "custom_object_definitions"
        DROP COLUMN IF EXISTS "base_object_type"
    `);
  }
}
