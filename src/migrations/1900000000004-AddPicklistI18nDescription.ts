import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPicklistI18nDescription1900000000004 implements MigrationInterface {
  name = 'AddPicklistI18nDescription1900000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "picklist_i18n" ADD COLUMN "description" text NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "picklist_i18n" DROP COLUMN "description"`,
    );
  }
}
