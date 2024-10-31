import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangePublishedToPublic1730304392337 implements MigrationInterface {
  name = 'ChangePublishedToPublic1730304392337';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 기존 enum 컬럼을 text 타입으로 임시 변경하여 데이터 업데이트
    await queryRunner.query(`ALTER TABLE "review_queue" ALTER COLUMN "type" TYPE text`);
    await queryRunner.query(`ALTER TABLE "processed_history" ALTER COLUMN "action_type" TYPE text`);
    await queryRunner.query(`ALTER TABLE "alert" ALTER COLUMN "type" TYPE text`);
    await queryRunner.query(`ALTER TABLE "essay" ALTER COLUMN "status" TYPE text`);

    // 2. 기존 `published` 데이터를 임시 값 `temp_value`로 변경
    await queryRunner.query(
      `UPDATE "review_queue" SET "type" = 'temp_value' WHERE "type" = 'published'`,
    );
    await queryRunner.query(
      `UPDATE "processed_history" SET "action_type" = 'temp_value' WHERE "action_type" = 'published'`,
    );
    await queryRunner.query(`UPDATE "alert" SET "type" = 'temp_value' WHERE "type" = 'published'`);
    await queryRunner.query(
      `UPDATE "essay" SET "status" = 'temp_value' WHERE "status" = 'published'`,
    );

    // 3. 새로운 enum 타입 생성 및 적용
    // review_queue_type_enum 변경
    await queryRunner.query(
      `ALTER TYPE "public"."review_queue_type_enum" RENAME TO "review_queue_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."review_queue_type_enum" AS ENUM('linkedout', 'public', 'burial')`,
    );
    await queryRunner.query(
      `ALTER TABLE "review_queue" ALTER COLUMN "type" TYPE "public"."review_queue_type_enum" USING "type"::"text"::"public"."review_queue_type_enum"`,
    );

    // processed_history_action_type_enum 변경
    await queryRunner.query(
      `ALTER TYPE "public"."processed_history_action_type_enum" RENAME TO "processed_history_action_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."processed_history_action_type_enum" AS ENUM('approved', 'rejected', 'pending', 'updated', 'deleted', 'unpublic', 'unlinkedout', 'public', 'linkedout', 'banned', 'monitored', 'answered')`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" ALTER COLUMN "action_type" TYPE "public"."processed_history_action_type_enum" USING "action_type"::"text"::"public"."processed_history_action_type_enum"`,
    );

    // alert_type_enum 변경
    await queryRunner.query(
      `ALTER TYPE "public"."alert_type_enum" RENAME TO "alert_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."alert_type_enum" AS ENUM('public', 'linkedout', 'support')`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert" ALTER COLUMN "type" TYPE "public"."alert_type_enum" USING "type"::"text"::"public"."alert_type_enum"`,
    );

    // essay_status_enum 변경
    await queryRunner.query(
      `ALTER TYPE "public"."essay_status_enum" RENAME TO "essay_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."essay_status_enum" AS ENUM('private', 'public')`,
    );
    await queryRunner.query(
      `ALTER TABLE "essay" ALTER COLUMN "status" TYPE "public"."essay_status_enum" USING "status"::"text"::"public"."essay_status_enum"`,
    );

    // 4. 임시 값 `temp_value`를 최종 값 `public`으로 업데이트
    await queryRunner.query(
      `UPDATE "review_queue" SET "type" = 'public' WHERE "type" = 'temp_value'`,
    );
    await queryRunner.query(
      `UPDATE "processed_history" SET "action_type" = 'public' WHERE "action_type" = 'temp_value'`,
    );
    await queryRunner.query(`UPDATE "alert" SET "type" = 'public' WHERE "type" = 'temp_value'`);
    await queryRunner.query(`UPDATE "essay" SET "status" = 'public' WHERE "status" = 'temp_value'`);

    // 5. 기존 enum 타입 삭제
    await queryRunner.query(`DROP TYPE "public"."review_queue_type_enum_old"`);
    await queryRunner.query(`DROP TYPE "public"."processed_history_action_type_enum_old"`);
    await queryRunner.query(`DROP TYPE "public"."alert_type_enum_old"`);
    await queryRunner.query(`DROP TYPE "public"."essay_status_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 다운 마이그레이션: 기존 데이터 복원 및 enum 타입 원래대로 복구
    await queryRunner.query(`ALTER TABLE "review_queue" ALTER COLUMN "type" TYPE text`);
    await queryRunner.query(`ALTER TABLE "processed_history" ALTER COLUMN "action_type" TYPE text`);
    await queryRunner.query(`ALTER TABLE "alert" ALTER COLUMN "type" TYPE text`);
    await queryRunner.query(`ALTER TABLE "essay" ALTER COLUMN "status" TYPE text`);

    await queryRunner.query(
      `UPDATE "review_queue" SET "type" = 'temp_value' WHERE "type" = 'public'`,
    );
    await queryRunner.query(
      `UPDATE "processed_history" SET "action_type" = 'temp_value' WHERE "action_type" = 'public'`,
    );
    await queryRunner.query(`UPDATE "alert" SET "type" = 'temp_value' WHERE "type" = 'public'`);
    await queryRunner.query(`UPDATE "essay" SET "status" = 'temp_value' WHERE "status" = 'public'`);

    await queryRunner.query(
      `CREATE TYPE "public"."review_queue_type_enum_old" AS ENUM('linkedout', 'published', 'burial')`,
    );
    await queryRunner.query(
      `ALTER TABLE "review_queue" ALTER COLUMN "type" TYPE "public"."review_queue_type_enum_old" USING "type"::"text"::"public"."review_queue_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."review_queue_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."review_queue_type_enum_old" RENAME TO "review_queue_type_enum"`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."processed_history_action_type_enum_old" AS ENUM('approved', 'rejected', 'pending', 'updated', 'deleted', 'unpublished', 'unlinkedout', 'published', 'public', 'linkedout', 'banned', 'monitored', 'answered')`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" ALTER COLUMN "action_type" TYPE "public"."processed_history_action_type_enum_old" USING "action_type"::"text"::"public"."processed_history_action_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."processed_history_action_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."processed_history_action_type_enum_old" RENAME TO "processed_history_action_type_enum"`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."alert_type_enum_old" AS ENUM('published', 'linkedout', 'support')`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert" ALTER COLUMN "type" TYPE "public"."alert_type_enum_old" USING "type"::"text"::"public"."alert_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."alert_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."alert_type_enum_old" RENAME TO "alert_type_enum"`,
    );

    await queryRunner.query(`CREATE TYPE "public"."essay_status_enum_old" AS ENUM('private')`);
    await queryRunner.query(
      `ALTER TABLE "essay" ALTER COLUMN "status" TYPE "public"."essay_status_enum_old" USING "status"::"text"::"public"."essay_status_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."essay_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."essay_status_enum_old" RENAME TO "essay_status_enum"`,
    );

    await queryRunner.query(
      `UPDATE "review_queue" SET "type" = 'published' WHERE "type" = 'temp_value'`,
    );
    await queryRunner.query(
      `UPDATE "processed_history" SET "action_type" = 'published' WHERE "action_type" = 'temp_value'`,
    );
    await queryRunner.query(`UPDATE "alert" SET "type" = 'published' WHERE "type" = 'temp_value'`);
    await queryRunner.query(
      `UPDATE "essay" SET "status" = 'private' WHERE "status" = 'temp_value'`,
    );
  }
}
