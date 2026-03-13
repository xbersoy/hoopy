import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrgStructureTables1740610800000 implements MigrationInterface {
  name = 'CreateOrgStructureTables1740610800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for org unit status
    await queryRunner.query(`
      CREATE TYPE "org_unit_status_enum" AS ENUM('ACTIVE', 'INACTIVE')
    `);

    // ── org_unit_types ──────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "org_unit_types" (
        "id"          uuid DEFAULT uuid_generate_v4() NOT NULL,
        "company_id"  uuid NOT NULL,
        "name"        varchar(255) NOT NULL,
        "slug"        varchar(255) NOT NULL,
        "color"       varchar(50),
        "icon"        varchar(100),
        "created_at"  TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_org_unit_types" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_org_unit_type_company_slug" UNIQUE ("company_id", "slug"),
        CONSTRAINT "FK_org_unit_type_company" FOREIGN KEY ("company_id")
          REFERENCES "companies"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_org_unit_type_company" ON "org_unit_types" ("company_id")`,
    );

    // ── org_units ───────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "org_units" (
        "id"          uuid DEFAULT uuid_generate_v4() NOT NULL,
        "company_id"  uuid NOT NULL,
        "parent_id"   uuid,
        "type_id"     uuid,
        "name"        varchar(255) NOT NULL,
        "code"        varchar(50),
        "description" text,
        "status"      "org_unit_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "sort_order"  integer,
        "path"        varchar(2048) NOT NULL DEFAULT '',
        "depth"       integer NOT NULL DEFAULT 0,
        "created_at"  TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_org_units" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_org_unit_company_parent_name" UNIQUE ("company_id", "parent_id", "name"),
        CONSTRAINT "FK_org_unit_company" FOREIGN KEY ("company_id")
          REFERENCES "companies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_org_unit_parent" FOREIGN KEY ("parent_id")
          REFERENCES "org_units"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_org_unit_type" FOREIGN KEY ("type_id")
          REFERENCES "org_unit_types"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_org_unit_company_parent" ON "org_units" ("company_id", "parent_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_org_unit_company_path" ON "org_units" ("company_id", "path")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_org_unit_depth" ON "org_units" ("depth")`,
    );

    // ── org_unit_links (future matrix overlay) ──────────────────
    await queryRunner.query(`
      CREATE TABLE "org_unit_links" (
        "id"                uuid DEFAULT uuid_generate_v4() NOT NULL,
        "company_id"        uuid NOT NULL,
        "from_org_unit_id"  uuid NOT NULL,
        "to_org_unit_id"    uuid NOT NULL,
        "link_type"         varchar(100) NOT NULL,
        "is_primary"        boolean NOT NULL DEFAULT false,
        "effective_start"   TIMESTAMP WITH TIME ZONE,
        "effective_end"     TIMESTAMP WITH TIME ZONE,
        "created_at"        TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_org_unit_links" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_org_unit_link_company_from_to_type" UNIQUE ("company_id", "from_org_unit_id", "to_org_unit_id", "link_type"),
        CONSTRAINT "FK_org_unit_link_company" FOREIGN KEY ("company_id")
          REFERENCES "companies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_org_unit_link_from" FOREIGN KEY ("from_org_unit_id")
          REFERENCES "org_units"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_org_unit_link_to" FOREIGN KEY ("to_org_unit_id")
          REFERENCES "org_units"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_org_unit_link_company_from" ON "org_unit_links" ("company_id", "from_org_unit_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_org_unit_link_company_to" ON "org_unit_links" ("company_id", "to_org_unit_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "org_unit_links"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "org_units"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "org_unit_types"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "org_unit_status_enum"`);
  }
}
