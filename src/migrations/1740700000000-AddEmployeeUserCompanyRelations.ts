import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
  TableUnique,
} from 'typeorm';

export class AddEmployeeUserCompanyRelations1740700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add company_id to employees
    await queryRunner.addColumn(
      'employees',
      new TableColumn({
        name: 'company_id',
        type: 'uuid',
        isNullable: true,
      }),
    );
    await queryRunner.createForeignKey(
      'employees',
      new TableForeignKey({
        name: 'fk_employees_company',
        columnNames: ['company_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'companies',
        onDelete: 'SET NULL',
      }),
    );

    // 2. Add user_id to employees (unique for OneToOne)
    await queryRunner.addColumn(
      'employees',
      new TableColumn({
        name: 'user_id',
        type: 'uuid',
        isNullable: true,
      }),
    );
    await queryRunner.createForeignKey(
      'employees',
      new TableForeignKey({
        name: 'fk_employees_user',
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createUniqueConstraint(
      'employees',
      new TableUnique({
        name: 'uq_employees_user_id',
        columnNames: ['user_id'],
      }),
    );

    // 3. Add employee_id to users (unique for OneToOne)
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'employee_id',
        type: 'uuid',
        isNullable: true,
      }),
    );
    await queryRunner.createForeignKey(
      'users',
      new TableForeignKey({
        name: 'fk_users_employee',
        columnNames: ['employee_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'employees',
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createUniqueConstraint(
      'users',
      new TableUnique({
        name: 'uq_users_employee_id',
        columnNames: ['employee_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropUniqueConstraint('users', 'uq_users_employee_id');
    await queryRunner.dropForeignKey('users', 'fk_users_employee');
    await queryRunner.dropColumn('users', 'employee_id');

    await queryRunner.dropUniqueConstraint('employees', 'uq_employees_user_id');
    await queryRunner.dropForeignKey('employees', 'fk_employees_user');
    await queryRunner.dropColumn('employees', 'user_id');

    await queryRunner.dropForeignKey('employees', 'fk_employees_company');
    await queryRunner.dropColumn('employees', 'company_id');
  }
}
