import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRbacTables1804000000000 implements MigrationInterface {
  name = 'CreateRbacTables1804000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. permissions (global lookup table)
    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "action" character varying(50) NOT NULL,
        "resource_type" character varying(100) NOT NULL,
        "description" character varying(255),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_permissions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_permissions_action_resource" UNIQUE ("action", "resource_type")
      )
    `);

    // 2. permission_roles (company-scoped named bundles)
    await queryRunner.query(`
      CREATE TABLE "permission_roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "description" character varying(255),
        "company_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_permission_roles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_permission_roles_name_company" UNIQUE ("name", "company_id"),
        CONSTRAINT "FK_permission_roles_company" FOREIGN KEY ("company_id")
          REFERENCES "companies"("id") ON DELETE CASCADE
      )
    `);

    // 3. permission_role_rights (join: permission_role <-> permission)
    await queryRunner.query(`
      CREATE TABLE "permission_role_rights" (
        "permission_role_id" uuid NOT NULL,
        "permission_id" uuid NOT NULL,
        CONSTRAINT "PK_permission_role_rights" PRIMARY KEY ("permission_role_id", "permission_id"),
        CONSTRAINT "FK_prr_permission_role" FOREIGN KEY ("permission_role_id")
          REFERENCES "permission_roles"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_prr_permission" FOREIGN KEY ("permission_id")
          REFERENCES "permissions"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_prr_permission_role_id" ON "permission_role_rights" ("permission_role_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_prr_permission_id" ON "permission_role_rights" ("permission_id")`,
    );

    // 4. user_roles (join: user <-> permission_role, company-scoped)
    await queryRunner.query(`
      CREATE TABLE "user_roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "permission_role_id" uuid NOT NULL,
        "company_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_roles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_roles_user_role_company" UNIQUE ("user_id", "permission_role_id", "company_id"),
        CONSTRAINT "FK_user_roles_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_roles_permission_role" FOREIGN KEY ("permission_role_id")
          REFERENCES "permission_roles"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_roles_company" FOREIGN KEY ("company_id")
          REFERENCES "companies"("id") ON DELETE CASCADE
      )
    `);

    // 5. user_rights (direct permission grant to a user, company-scoped)
    await queryRunner.query(`
      CREATE TABLE "user_rights" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "permission_id" uuid NOT NULL,
        "company_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_rights" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_rights_user_permission_company" UNIQUE ("user_id", "permission_id", "company_id"),
        CONSTRAINT "FK_user_rights_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_rights_permission" FOREIGN KEY ("permission_id")
          REFERENCES "permissions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_rights_company" FOREIGN KEY ("company_id")
          REFERENCES "companies"("id") ON DELETE CASCADE
      )
    `);

    // 6. permission_groups (company-scoped, named group)
    await queryRunner.query(`
      CREATE TABLE "permission_groups" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "description" character varying(255),
        "company_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_permission_groups" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_permission_groups_name_company" UNIQUE ("name", "company_id"),
        CONSTRAINT "FK_permission_groups_company" FOREIGN KEY ("company_id")
          REFERENCES "companies"("id") ON DELETE CASCADE
      )
    `);

    // 7. permission_group_memberships (join: group <-> user)
    await queryRunner.query(`
      CREATE TABLE "permission_group_memberships" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "permission_group_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_permission_group_memberships" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_pgm_group_user" UNIQUE ("permission_group_id", "user_id"),
        CONSTRAINT "FK_pgm_group" FOREIGN KEY ("permission_group_id")
          REFERENCES "permission_groups"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_pgm_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // 8. permission_group_roles (join: group <-> permission_role)
    await queryRunner.query(`
      CREATE TABLE "permission_group_roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "permission_group_id" uuid NOT NULL,
        "permission_role_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_permission_group_roles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_pgr_group_role" UNIQUE ("permission_group_id", "permission_role_id"),
        CONSTRAINT "FK_pgr_group" FOREIGN KEY ("permission_group_id")
          REFERENCES "permission_groups"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_pgr_role" FOREIGN KEY ("permission_role_id")
          REFERENCES "permission_roles"("id") ON DELETE CASCADE
      )
    `);

    // 9. people_pools (part of permission_group, included or excluded)
    await queryRunner.query(`
      CREATE TABLE "people_pools" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "permission_group_id" uuid NOT NULL,
        "pool_type" character varying(20) NOT NULL DEFAULT 'included',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_people_pools" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_people_pools_type" CHECK ("pool_type" IN ('included', 'excluded')),
        CONSTRAINT "FK_people_pools_group" FOREIGN KEY ("permission_group_id")
          REFERENCES "permission_groups"("id") ON DELETE CASCADE
      )
    `);

    // 10. people_pool_conditions (field + values filter)
    await queryRunner.query(`
      CREATE TABLE "people_pool_conditions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "people_pool_id" uuid NOT NULL,
        "field" character varying(100) NOT NULL,
        "values" jsonb NOT NULL DEFAULT '[]',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_people_pool_conditions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ppc_people_pool" FOREIGN KEY ("people_pool_id")
          REFERENCES "people_pools"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "people_pool_conditions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "people_pools"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permission_group_roles"`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "permission_group_memberships"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "permission_groups"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_rights"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permission_role_rights"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permission_roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions"`);
  }
}
