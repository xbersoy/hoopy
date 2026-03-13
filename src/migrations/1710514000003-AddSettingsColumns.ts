import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSettingsColumns1710514000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
    `);
    await queryRunner.query(`
      ALTER TABLE companies ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
    `);
    await queryRunner.query(`
      ALTER TABLE accounts ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE accounts DROP COLUMN settings;`);
    await queryRunner.query(`ALTER TABLE companies DROP COLUMN settings;`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN settings;`);
  }
}
