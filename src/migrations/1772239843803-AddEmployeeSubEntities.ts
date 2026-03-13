import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmployeeSubEntities1772239843803 implements MigrationInterface {
  name = 'AddEmployeeSubEntities1772239843803';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enum types
    await queryRunner.query(
      `CREATE TYPE "public"."employee_emergency_contacts_relationship_enum" AS ENUM('SPOUSE', 'PARENT', 'SIBLING', 'CHILD', 'FRIEND', 'DOMESTIC_PARTNER', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."employee_dependents_relationship_enum" AS ENUM('SPOUSE', 'PARENT', 'SIBLING', 'CHILD', 'FRIEND', 'DOMESTIC_PARTNER', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."employee_dependents_gender_enum" AS ENUM('MALE', 'FEMALE', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."employee_job_informations_employment_type_enum" AS ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'TEMPORARY')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."employee_licenses_certifications_type_enum" AS ENUM('LICENSE', 'CERTIFICATION')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."employee_national_ids_id_type_enum" AS ENUM('NATIONAL_ID', 'PASSPORT', 'TAX_ID', 'SOCIAL_SECURITY', 'DRIVERS_LICENSE', 'OTHER')`,
    );

    // Tables
    await queryRunner.query(
      `CREATE TABLE "employee_emergency_contacts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "full_name" character varying NOT NULL, "relationship" "public"."employee_emergency_contacts_relationship_enum" NOT NULL, "phone" character varying NOT NULL, "email" character varying, "address" character varying, "is_primary" boolean NOT NULL DEFAULT false, "employee_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bdc864d96d84ec70e0df9965c8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "employee_dependents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "full_name" character varying NOT NULL, "relationship" "public"."employee_dependents_relationship_enum" NOT NULL, "date_of_birth" date, "gender" "public"."employee_dependents_gender_enum", "national_id" character varying, "employee_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0a3ad586f70d1170cec26f3b2cc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "employee_work_experiences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_name" character varying NOT NULL, "job_title" character varying NOT NULL, "start_date" date NOT NULL, "end_date" date, "location" character varying, "description" character varying, "reason_for_leaving" character varying, "employee_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0d3fdeda92b7716fd07b5a07b69" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "employee_job_informations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "effective_date" date NOT NULL, "end_date" date, "job_title" character varying NOT NULL, "department" character varying, "location" character varying, "employment_type" "public"."employee_job_informations_employment_type_enum" NOT NULL, "manager_id" uuid, "notes" character varying, "employee_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bd25c118b1ffacb7da4b6be94e8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "employee_licenses_certifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "type" "public"."employee_licenses_certifications_type_enum" NOT NULL, "issuing_organization" character varying, "issue_date" date, "expiration_date" date, "credential_id" character varying, "description" character varying, "employee_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cb7acd2f18e1d2ba4514975a184" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "employee_national_ids" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "id_type" "public"."employee_national_ids_id_type_enum" NOT NULL, "id_number" character varying NOT NULL, "country" character varying, "issue_date" date, "expiration_date" date, "issuing_authority" character varying, "employee_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8b9ca1f79aac395d44c94ceb3aa" PRIMARY KEY ("id"))`,
    );

    // Foreign keys
    await queryRunner.query(
      `ALTER TABLE "employee_emergency_contacts" ADD CONSTRAINT "FK_71d23315e92a0b0342d4632a29f" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_dependents" ADD CONSTRAINT "FK_7ce84fe29120bf21a1d581a3adf" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_work_experiences" ADD CONSTRAINT "FK_69f87b2e4c4a05db68eeb9c0cde" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_job_informations" ADD CONSTRAINT "FK_7f159067e83aa00ac094dee74c7" FOREIGN KEY ("manager_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_job_informations" ADD CONSTRAINT "FK_53fca4826925fd2c52605d9e784" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_licenses_certifications" ADD CONSTRAINT "FK_f2f2d58e7da4e63c6fe21db8616" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_national_ids" ADD CONSTRAINT "FK_f042fd99caad39d13004b4e975d" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.query(
      `ALTER TABLE "employee_national_ids" DROP CONSTRAINT "FK_f042fd99caad39d13004b4e975d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_licenses_certifications" DROP CONSTRAINT "FK_f2f2d58e7da4e63c6fe21db8616"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_job_informations" DROP CONSTRAINT "FK_53fca4826925fd2c52605d9e784"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_job_informations" DROP CONSTRAINT "FK_7f159067e83aa00ac094dee74c7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_work_experiences" DROP CONSTRAINT "FK_69f87b2e4c4a05db68eeb9c0cde"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_dependents" DROP CONSTRAINT "FK_7ce84fe29120bf21a1d581a3adf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_emergency_contacts" DROP CONSTRAINT "FK_71d23315e92a0b0342d4632a29f"`,
    );

    // Drop tables
    await queryRunner.query(`DROP TABLE "employee_national_ids"`);
    await queryRunner.query(`DROP TABLE "employee_licenses_certifications"`);
    await queryRunner.query(`DROP TABLE "employee_job_informations"`);
    await queryRunner.query(`DROP TABLE "employee_work_experiences"`);
    await queryRunner.query(`DROP TABLE "employee_dependents"`);
    await queryRunner.query(`DROP TABLE "employee_emergency_contacts"`);

    // Drop enum types
    await queryRunner.query(
      `DROP TYPE "public"."employee_national_ids_id_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."employee_licenses_certifications_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."employee_job_informations_employment_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."employee_dependents_gender_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."employee_dependents_relationship_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."employee_emergency_contacts_relationship_enum"`,
    );
  }
}
