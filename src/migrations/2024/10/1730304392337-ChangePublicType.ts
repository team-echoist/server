import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangePublicType1730304392337 implements MigrationInterface {
  name = 'ChangePublicType1730304392337';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 기존 published 데이터를 임시 값으로 변경
    await queryRunner.query(`
      UPDATE "review_queue" SET "type" = 'burial' WHERE "type" = 'published'
    `);
    await queryRunner.query(`
      UPDATE "processed_history" SET "action_type" = 'linkedout' WHERE "action_type" = 'published'
    `);
    await queryRunner.query(`
      UPDATE "alert" SET "type" = 'linkedout' WHERE "type" = 'published'
    `);

    // 2. review_queue_type_enum 변경
    await queryRunner.query(
      `ALTER TYPE "public"."review_queue_type_enum" RENAME TO "review_queue_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."review_queue_type_enum" AS ENUM('linkedout', 'public', 'burial')`,
    );
    await queryRunner.query(
      `ALTER TABLE "review_queue" ALTER COLUMN "type" TYPE "public"."review_queue_type_enum" USING "type"::"text"::"public"."review_queue_type_enum"`,
    );

    // 3. processed_history_action_type_enum 변경
    await queryRunner.query(
      `ALTER TYPE "public"."processed_history_action_type_enum" RENAME TO "processed_history_action_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."processed_history_action_type_enum" AS ENUM('approved', 'rejected', 'pending', 'updated', 'deleted', 'unpublic', 'unlinkedout', 'public', 'linkedout', 'banned', 'monitored', 'answered')`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" ALTER COLUMN "action_type" TYPE "public"."processed_history_action_type_enum" USING "action_type"::"text"::"public"."processed_history_action_type_enum"`,
    );

    // 4. alert_type_enum 변경
    await queryRunner.query(
      `ALTER TYPE "public"."alert_type_enum" RENAME TO "alert_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."alert_type_enum" AS ENUM('public', 'linkedout', 'support')`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert" ALTER COLUMN "type" TYPE "public"."alert_type_enum" USING "type"::"text"::"public"."alert_type_enum"`,
    );

    // 여기까지 ENUM 타입을 변경하고 나서, 기존 타입은 삭제
    await queryRunner.query(`DROP TYPE "public"."review_queue_type_enum_old"`);
    await queryRunner.query(`DROP TYPE "public"."processed_history_action_type_enum_old"`);
    await queryRunner.query(`DROP TYPE "public"."alert_type_enum_old"`);

    // 5. 데이터 업데이트 (enum 변경 이후에 실행)
    await queryRunner.query(`
      UPDATE "review_queue" SET "type" = 'public' WHERE "type" = 'burial'
    `);
    await queryRunner.query(`
      UPDATE "processed_history" SET "action_type" = 'public' WHERE "action_type" = 'linkedout'
    `);
    await queryRunner.query(`
      UPDATE "alert" SET "type" = 'public' WHERE "type" = 'linkedout'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. alert_type_enum 복구
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

    // 2. processed_history_action_type_enum 복구
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

    // 3. review_queue_type_enum 복구
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

    // 4. 데이터 복구
    await queryRunner.query(`
      UPDATE "review_queue" SET "type" = 'published' WHERE "type" = 'public'
    `);
    await queryRunner.query(`
      UPDATE "processed_history" SET "action_type" = 'unpublished' WHERE "action_type" = 'unpublic'
    `);
    await queryRunner.query(`
      UPDATE "processed_history" SET "action_type" = 'published' WHERE "action_type" = 'public'
    `);
    await queryRunner.query(`
      UPDATE "alert" SET "type" = 'published' WHERE "type" = 'public'
    `);
  }
}
