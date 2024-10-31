import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangePublishedToPublic1730304392337 implements MigrationInterface {
  name = 'ChangePublishedToPublic1730304392337';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 새로운 enum 타입을 미리 생성
    await queryRunner.query(
      `CREATE TYPE "public"."new_review_queue_type_enum" AS ENUM('linkedout', 'public', 'burial')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."new_processed_history_action_type_enum" AS ENUM('approved', 'rejected', 'pending', 'updated', 'deleted', 'unpublic', 'unlinkedout', 'public', 'linkedout', 'banned', 'monitored', 'answered')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."new_alert_type_enum" AS ENUM('public', 'linkedout', 'support')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."new_essay_status_enum" AS ENUM('private', 'public')`,
    );

    // 2. 기존 `published` 및 `unpublished` 데이터를 임시 값으로 업데이트
    await queryRunner.query(
      `UPDATE "review_queue" SET "type" = 'public' WHERE "type" = 'published'`,
    );
    await queryRunner.query(
      `UPDATE "processed_history" SET "action_type" = 'public' WHERE "action_type" = 'published'`,
    );
    await queryRunner.query(`UPDATE "alert" SET "type" = 'public' WHERE "type" = 'published'`);
    await queryRunner.query(
      `UPDATE "processed_history" SET "action_type" = 'unpublic' WHERE "action_type" = 'unpublished'`,
    );

    // 3. 새 enum 타입으로 컬럼 변경
    await queryRunner.query(
      `ALTER TABLE "review_queue" ALTER COLUMN "type" TYPE "public"."new_review_queue_type_enum" USING "type"::"text"::"public"."new_review_queue_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" ALTER COLUMN "action_type" TYPE "public"."new_processed_history_action_type_enum" USING "action_type"::"text"::"public"."new_processed_history_action_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert" ALTER COLUMN "type" TYPE "public"."new_alert_type_enum" USING "type"::"text"::"public"."new_alert_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "essay" ALTER COLUMN "status" TYPE "public"."new_essay_status_enum" USING "status"::"text"::"public"."new_essay_status_enum"`,
    );

    // 4. 기존 enum 타입 삭제 후 새 enum 타입 이름 변경
    await queryRunner.query(`DROP TYPE "public"."review_queue_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."new_review_queue_type_enum" RENAME TO "review_queue_type_enum"`,
    );

    await queryRunner.query(`DROP TYPE "public"."processed_history_action_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."new_processed_history_action_type_enum" RENAME TO "processed_history_action_type_enum"`,
    );

    await queryRunner.query(`DROP TYPE "public"."alert_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."new_alert_type_enum" RENAME TO "alert_type_enum"`,
    );

    await queryRunner.query(`DROP TYPE "public"."essay_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."new_essay_status_enum" RENAME TO "essay_status_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. 기존 enum 타입을 복원하기 위해 새로운 enum 타입 생성
    await queryRunner.query(
      `CREATE TYPE "public"."old_review_queue_type_enum" AS ENUM('linkedout', 'published', 'burial')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."old_processed_history_action_type_enum" AS ENUM('approved', 'rejected', 'pending', 'updated', 'deleted', 'unpublished', 'unlinkedout', 'published', 'public', 'linkedout', 'banned', 'monitored', 'answered')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."old_alert_type_enum" AS ENUM('published', 'linkedout', 'support')`,
    );
    await queryRunner.query(`CREATE TYPE "public"."old_essay_status_enum" AS ENUM('private')`);

    // 2. 데이터 원래대로 복원
    await queryRunner.query(
      `UPDATE "review_queue" SET "type" = 'published' WHERE "type" = 'public'`,
    );
    await queryRunner.query(
      `UPDATE "processed_history" SET "action_type" = 'published' WHERE "action_type" = 'public'`,
    );
    await queryRunner.query(`UPDATE "alert" SET "type" = 'published' WHERE "type" = 'public'`);
    await queryRunner.query(
      `UPDATE "processed_history" SET "action_type" = 'unpublished' WHERE "action_type" = 'unpublic'`,
    );

    // 3. 기존 enum 타입으로 컬럼 복원
    await queryRunner.query(
      `ALTER TABLE "review_queue" ALTER COLUMN "type" TYPE "public"."old_review_queue_type_enum" USING "type"::"text"::"public"."old_review_queue_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" ALTER COLUMN "action_type" TYPE "public"."old_processed_history_action_type_enum" USING "action_type"::"text"::"public"."old_processed_history_action_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert" ALTER COLUMN "type" TYPE "public"."old_alert_type_enum" USING "type"::"text"::"public"."old_alert_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "essay" ALTER COLUMN "status" TYPE "public"."old_essay_status_enum" USING "status"::"text"::"public"."old_essay_status_enum"`,
    );

    // 4. 새 enum 타입 삭제 후 기존 enum 타입 이름 복원
    await queryRunner.query(`DROP TYPE "public"."review_queue_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."old_review_queue_type_enum" RENAME TO "review_queue_type_enum"`,
    );

    await queryRunner.query(`DROP TYPE "public"."processed_history_action_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."old_processed_history_action_type_enum" RENAME TO "processed_history_action_type_enum"`,
    );

    await queryRunner.query(`DROP TYPE "public"."alert_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."old_alert_type_enum" RENAME TO "alert_type_enum"`,
    );

    await queryRunner.query(`DROP TYPE "public"."essay_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."old_essay_status_enum" RENAME TO "essay_status_enum"`,
    );
  }
}
