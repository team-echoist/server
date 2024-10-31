import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangePublicType1730304392337 implements MigrationInterface {
  name = 'ChangePublicType1730304392337';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 필요한 enum 값이 이미 있는지 확인 후, 없다면 추가
    await queryRunner.query(`
      DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'public' AND enumtypid = 'review_queue_type_enum'::regtype) THEN
          ALTER TYPE "public"."review_queue_type_enum" ADD VALUE 'public';
      END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'public' AND enumtypid = 'processed_history_action_type_enum'::regtype) THEN
          ALTER TYPE "public"."processed_history_action_type_enum" ADD VALUE 'public';
      END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'unpublic' AND enumtypid = 'processed_history_action_type_enum'::regtype) THEN
          ALTER TYPE "public"."processed_history_action_type_enum" ADD VALUE 'unpublic';
      END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'public' AND enumtypid = 'alert_type_enum'::regtype) THEN
          ALTER TYPE "public"."alert_type_enum" ADD VALUE 'public';
      END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'public' AND enumtypid = 'essay_status_enum'::regtype) THEN
          ALTER TYPE "public"."essay_status_enum" ADD VALUE 'public';
      END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'burial' AND enumtypid = 'essay_status_enum'::regtype) THEN
          ALTER TYPE "public"."essay_status_enum" ADD VALUE 'burial';
      END IF;
      END $$;
    `);

    // 2. 기존 `published` 및 `unpublished` 값을 각각 `public` 및 `unpublic`으로 업데이트
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

    // 3. `published` 및 `unpublished` 값을 `enum`에서 삭제
    await queryRunner.query(`
      DELETE FROM pg_enum 
      WHERE enumlabel = 'published' AND enumtypid = 'review_queue_type_enum'::regtype;
    `);

    await queryRunner.query(`
      DELETE FROM pg_enum 
      WHERE enumlabel = 'published' AND enumtypid = 'processed_history_action_type_enum'::regtype;
    `);

    await queryRunner.query(`
      DELETE FROM pg_enum 
      WHERE enumlabel = 'published' AND enumtypid = 'alert_type_enum'::regtype;
    `);

    await queryRunner.query(`
      DELETE FROM pg_enum 
      WHERE enumlabel = 'unpublished' AND enumtypid = 'processed_history_action_type_enum'::regtype;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 다운 마이그레이션: 원래 상태로 복구 (published 및 unpublished 값 추가)
    await queryRunner.query(`
      ALTER TYPE "public"."review_queue_type_enum" ADD VALUE 'published';
    `);

    await queryRunner.query(`
      ALTER TYPE "public"."processed_history_action_type_enum" ADD VALUE 'published';
    `);

    await queryRunner.query(`
      ALTER TYPE "public"."alert_type_enum" ADD VALUE 'published';
    `);

    await queryRunner.query(`
      ALTER TYPE "public"."processed_history_action_type_enum" ADD VALUE 'unpublished';
    `);

    // 복구 시 `public` 및 `unpublic` 값은 그대로 유지됩니다.
  }
}
