import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompetencyCategoriesTable1950000000001
  implements MigrationInterface
{
  name = 'AddCompetencyCategoriesTable1950000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Competency Categories table (catalog, Admin/HR managed)
    await queryRunner.query(`
      CREATE TABLE "competency_categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "code" character varying,
        "name" character varying NOT NULL,
        "description" character varying,
        "is_active" boolean NOT NULL DEFAULT true,
        "sort_order" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_competency_categories" PRIMARY KEY ("id")
      )
    `);

    // Unique index for name per company
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_competency_categories_company_name" ON "competency_categories" ("company_id", LOWER("name"))
    `);

    // Foreign key to companies
    await queryRunner.query(`
      ALTER TABLE "competency_categories" ADD CONSTRAINT "FK_competency_categories_company"
      FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Add competency_category_id column to competencies table
    await queryRunner.query(`
      ALTER TABLE "competencies" ADD COLUMN "competency_category_id" uuid
    `);

    // Foreign key from competencies to competency_categories
    await queryRunner.query(`
      ALTER TABLE "competencies" ADD CONSTRAINT "FK_competencies_competency_category"
      FOREIGN KEY ("competency_category_id") REFERENCES "competency_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // Index for competency_category_id
    await queryRunner.query(`
      CREATE INDEX "IDX_competencies_competency_category" ON "competencies" ("competency_category_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index on competency_category_id
    await queryRunner.query(
      `DROP INDEX "IDX_competencies_competency_category"`,
    );

    // Drop foreign key from competencies to competency_categories
    await queryRunner.query(
      `ALTER TABLE "competencies" DROP CONSTRAINT "FK_competencies_competency_category"`,
    );

    // Drop competency_category_id column from competencies
    await queryRunner.query(
      `ALTER TABLE "competencies" DROP COLUMN "competency_category_id"`,
    );

    // Drop foreign key from competency_categories to companies
    await queryRunner.query(
      `ALTER TABLE "competency_categories" DROP CONSTRAINT "FK_competency_categories_company"`,
    );

    // Drop unique index
    await queryRunner.query(
      `DROP INDEX "UQ_competency_categories_company_name"`,
    );

    // Drop competency_categories table
    await queryRunner.query(`DROP TABLE "competency_categories"`);
  }
}
