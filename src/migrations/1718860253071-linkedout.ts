import { MigrationInterface, QueryRunner } from 'typeorm';

export class Linkedout1718860253071 implements MigrationInterface {
  name = 'Linkedout1718860253071';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD "deactivation_date" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(
      `ALTER TYPE "public"."user_status_enum" RENAME TO "user_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_status_enum" AS ENUM('active', 'monitored', 'banned', 'deactivated')`,
    );
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "status" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "status" TYPE "public"."user_status_enum" USING "status"::"text"::"public"."user_status_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "status" SET DEFAULT 'active'`);
    await queryRunner.query(`DROP TYPE "public"."user_status_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."user_status_enum_old" AS ENUM('active', 'monitored', 'banned')`,
    );
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "status" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "status" TYPE "public"."user_status_enum_old" USING "status"::"text"::"public"."user_status_enum_old"`,
    );
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "status" SET DEFAULT 'active'`);
    await queryRunner.query(`DROP TYPE "public"."user_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."user_status_enum_old" RENAME TO "user_status_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "deactivation_date"`);
  }
}
