import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangePublicType1730304392337 implements MigrationInterface {
  name = 'ChangePublicType1730304392337';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 임시 타입 생성
    await queryRunner.query(
      `CREATE TYPE "public"."review_queue_type_enum_temp" AS ENUM('temp_value')`,
    );

    // 2. 기존 published 데이터를 임시 값 temp_value로 변경
    await queryRunner.query(`
      UPDATE "review_queue" SET "type" = 'temp_value' WHERE "type" = 'published'
    `);
    await queryRunner.query(`
      UPDATE "processed_history" SET "action_type" = 'temp_value' WHERE "action_type" = 'published'
    `);
    await queryRunner.query(`
      UPDATE "alert" SET "type" = 'temp_value' WHERE "type" = 'published'
    `);

    // 3. 기존 review_queue_type_enum을 새로운 값으로 대체
    await queryRunner.query(
      `ALTER TYPE "public"."review_queue_type_enum" RENAME TO "review_queue_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."review_queue_type_enum" AS ENUM('linkedout', 'public', 'burial')`,
    );
    await queryRunner.query(
      `ALTER TABLE "review_queue" ALTER COLUMN "type" TYPE "public"."review_queue_type_enum" USING "type"::"text"::"public"."review_queue_type_enum"`,
    );

    // 4. 다른 enum 타입도 동일하게 변경
    await queryRunner.query(
      `ALTER TYPE "public"."processed_history_action_type_enum" RENAME TO "processed_history_action_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."processed_history_action_type_enum" AS ENUM('approved', 'rejected', 'pending', 'updated', 'deleted', 'unpublic', 'unlinkedout', 'public', 'linkedout', 'banned', 'monitored', 'answered', 'temp_value')`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" ALTER COLUMN "action_type" TYPE "public"."processed_history_action_type_enum" USING "action_type"::"text"::"public"."processed_history_action_type_enum"`,
    );

    await queryRunner.query(
      `ALTER TYPE "public"."alert_type_enum" RENAME TO "alert_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."alert_type_enum" AS ENUM('public', 'linkedout', 'support', 'temp_value')`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert" ALTER COLUMN "type" TYPE "public"."alert_type_enum" USING "type"::"text"::"public"."alert_type_enum"`,
    );

    // 5. 임시 타입을 원래 값으로 변경
    await queryRunner.query(`
      UPDATE "review_queue" SET "type" = 'public' WHERE "type" = 'temp_value'
    `);
    await queryRunner.query(`
      UPDATE "processed_history" SET "action_type" = 'public' WHERE "action_type" = 'temp_value'
    `);
    await queryRunner.query(`
      UPDATE "alert" SET "type" = 'public' WHERE "type" = 'temp_value'
    `);

    // 6. 기존 타입 삭제 및 임시 타입 제거
    await queryRunner.query(`DROP TYPE "public"."review_queue_type_enum_old"`);
    await queryRunner.query(`DROP TYPE "public"."processed_history_action_type_enum_old"`);
    await queryRunner.query(`DROP TYPE "public"."alert_type_enum_old"`);
    await queryRunner.query(`DROP TYPE "public"."review_queue_type_enum_temp"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 다운 마이그레이션 시 원래대로 복구
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
      `CREATE TYPE "public"."review_queue_type_enum_old" AS ENUM('linkedout', 'published', 'burial')`,
    );
    await queryRunner.query(
      `ALTER TABLE "review_queue" ALTER COLUMN "type" TYPE "public"."review_queue_type_enum_old" USING "type"::"text"::"public"."review_queue_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."review_queue_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."review_queue_type_enum_old" RENAME TO "review_queue_type_enum"`,
    );

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
