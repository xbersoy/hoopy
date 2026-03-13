import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddArrayFieldTypes1900000000003 implements MigrationInterface {
  name = 'AddArrayFieldTypes1900000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the existing check constraint on data_type (created by synchronize or auto-schema)
    await queryRunner.query(
      `ALTER TABLE "custom_object_fields" DROP CONSTRAINT IF EXISTS "CHK_custom_object_fields_type"`,
    );

    // Clean up any rows with data_type values not in the allowed set
    await queryRunner.query(`
      DELETE FROM "custom_object_fields"
      WHERE "data_type" NOT IN (
        'STRING', 'NUMBER', 'BOOLEAN', 'DATE', 'SELECT', 'USER',
        'PICKLIST', 'CUSTOM_OBJECT', 'ATTACHMENT',
        'STRING_ARRAY', 'NUMBER_ARRAY'
      )
    `);

    // Re-create with the full set of allowed types including STRING_ARRAY and NUMBER_ARRAY
    await queryRunner.query(`
      ALTER TABLE "custom_object_fields"
        ADD CONSTRAINT "CHK_custom_object_fields_type"
        CHECK ("data_type" IN (
          'STRING', 'NUMBER', 'BOOLEAN', 'DATE', 'SELECT', 'USER',
          'PICKLIST', 'CUSTOM_OBJECT', 'ATTACHMENT',
          'STRING_ARRAY', 'NUMBER_ARRAY'
        ))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "custom_object_fields" DROP CONSTRAINT IF EXISTS "CHK_custom_object_fields_type"`,
    );

    // Restore original constraint without the array types
    await queryRunner.query(`
      ALTER TABLE "custom_object_fields"
        ADD CONSTRAINT "CHK_custom_object_fields_type"
        CHECK ("data_type" IN (
          'STRING', 'NUMBER', 'BOOLEAN', 'DATE', 'SELECT', 'USER',
          'PICKLIST', 'CUSTOM_OBJECT', 'ATTACHMENT'
        ))
    `);
  }
}
