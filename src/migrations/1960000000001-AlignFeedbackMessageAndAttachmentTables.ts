import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignFeedbackMessageAndAttachmentTables1960000000001
  implements MigrationInterface
{
  name = 'AlignFeedbackMessageAndAttachmentTables1960000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Align feedback_messages with entity fields
    await queryRunner.query(
      `ALTER TABLE "feedback_messages" DROP COLUMN IF EXISTS "sender_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_messages" DROP COLUMN IF EXISTS "sender_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_messages" DROP COLUMN IF EXISTS "attachments"`,
    );

    await queryRunner.query(
      `ALTER TABLE "feedback_messages" ADD COLUMN IF NOT EXISTS "is_system" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_messages" ADD COLUMN IF NOT EXISTS "author_user_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_messages" ADD CONSTRAINT "FK_feedback_message_author_user" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE SET NULL`,
    ).catch(() => undefined);

    // Create feedback_attachments table expected by entity relations
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "feedback_attachments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "feedback_item_id" uuid NOT NULL,
        "file_name" varchar(255) NOT NULL,
        "mime_type" varchar(100) NOT NULL,
        "file_size" int NOT NULL,
        "storage_path" varchar(500) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_feedback_attachments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_feedback_attachment_item" FOREIGN KEY ("feedback_item_id") REFERENCES "feedback_items"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_feedback_attachment_item" ON "feedback_attachments" ("feedback_item_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_feedback_attachment_item"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "feedback_attachments"`);

    await queryRunner.query(
      `ALTER TABLE "feedback_messages" DROP CONSTRAINT IF EXISTS "FK_feedback_message_author_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_messages" DROP COLUMN IF EXISTS "author_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_messages" DROP COLUMN IF EXISTS "is_system"`,
    );
  }
}
