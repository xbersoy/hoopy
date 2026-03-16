import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminAccessTable1900100000000 implements MigrationInterface {
  name = 'CreateAdminAccessTable1900100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "admin_access" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "account_id" uuid NOT NULL,
        "privileges" jsonb NOT NULL DEFAULT '[]',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_admin_access" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_admin_access_user_account" UNIQUE ("user_id", "account_id"),
        CONSTRAINT "FK_admin_access_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_admin_access_account" FOREIGN KEY ("account_id")
          REFERENCES "accounts"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_admin_access_account" ON "admin_access" ("account_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_access"`);
  }
}
