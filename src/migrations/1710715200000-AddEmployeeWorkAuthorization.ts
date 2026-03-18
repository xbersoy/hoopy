import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmployeeWorkAuthorization1710715200000 implements MigrationInterface {
  name = 'AddEmployeeWorkAuthorization1710715200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "public"."employee_work_authorizations_authorizationtype_enum" AS ENUM(
        'WORK_VISA', 'PERMANENT_RESIDENT', 'CITIZEN', 'WORK_PERMIT', 'EAD', 'TN_VISA', 'OTHER'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."employee_work_authorizations_status_enum" AS ENUM(
        'ACTIVE', 'EXPIRED', 'PENDING', 'REVOKED'
      )
    `);

    // Create table
    await queryRunner.query(`
      CREATE TABLE "employee_work_authorizations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "authorizationType" "public"."employee_work_authorizations_authorizationtype_enum" NOT NULL,
        "status" "public"."employee_work_authorizations_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "documentNumber" character varying,
        "country" character varying,
        "issueDate" date,
        "expirationDate" date,
        "issuingAuthority" character varying,
        "notes" text,
        "employee_id" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_employee_work_authorizations" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key
    await queryRunner.query(`
      ALTER TABLE "employee_work_authorizations"
      ADD CONSTRAINT "FK_employee_work_authorizations_employee"
      FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_work_authorizations" DROP CONSTRAINT "FK_employee_work_authorizations_employee"`,
    );
    await queryRunner.query(`DROP TABLE "employee_work_authorizations"`);
    await queryRunner.query(
      `DROP TYPE "public"."employee_work_authorizations_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."employee_work_authorizations_authorizationtype_enum"`,
    );
  }
}
