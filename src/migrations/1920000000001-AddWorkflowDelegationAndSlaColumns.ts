import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWorkflowDelegationAndSlaColumns1920000000001 implements MigrationInterface {
  name = 'AddWorkflowDelegationAndSlaColumns1920000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // workflow_step_instances: reminder/escalation tracking
    await queryRunner.query(`ALTER TABLE "workflow_step_instances" ADD COLUMN IF NOT EXISTS "reminder_sent_at" TIMESTAMPTZ`);
    await queryRunner.query(`ALTER TABLE "workflow_step_instances" ADD COLUMN IF NOT EXISTS "escalated_at" TIMESTAMPTZ`);

    // workflow_instances: SLA breach tracking
    await queryRunner.query(`ALTER TABLE "workflow_instances" ADD COLUMN IF NOT EXISTS "sla_breached_at" TIMESTAMPTZ`);

    // workflow_step_assignees: delegation support
    await queryRunner.query(`ALTER TABLE "workflow_step_assignees" ADD COLUMN IF NOT EXISTS "original_user_id" UUID`);
    await queryRunner.query(`ALTER TABLE "workflow_step_assignees" ADD COLUMN IF NOT EXISTS "delegated_by_id" UUID`);
    await queryRunner.query(`ALTER TABLE "workflow_step_assignees" ADD COLUMN IF NOT EXISTS "delegation_type" VARCHAR(50)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "workflow_step_assignees" DROP COLUMN IF EXISTS "delegation_type"`);
    await queryRunner.query(`ALTER TABLE "workflow_step_assignees" DROP COLUMN IF EXISTS "delegated_by_id"`);
    await queryRunner.query(`ALTER TABLE "workflow_step_assignees" DROP COLUMN IF EXISTS "original_user_id"`);
    await queryRunner.query(`ALTER TABLE "workflow_instances" DROP COLUMN IF EXISTS "sla_breached_at"`);
    await queryRunner.query(`ALTER TABLE "workflow_step_instances" DROP COLUMN IF EXISTS "escalated_at"`);
    await queryRunner.query(`ALTER TABLE "workflow_step_instances" DROP COLUMN IF EXISTS "reminder_sent_at"`);
  }
}
