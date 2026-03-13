import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNameFieldsToUsers1710514000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN first_name VARCHAR NOT NULL DEFAULT '',
      ADD COLUMN last_name VARCHAR NOT NULL DEFAULT '';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN first_name,
      DROP COLUMN last_name;
    `);
  }
}
