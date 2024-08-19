import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUserStatusEnum1718865750589 implements MigrationInterface {
  name = 'UpdateUserStatusEnum1718865750589';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add a temporary column to store the string value of status
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "status_temp" text`);

    // Step 2: Update the existing values to a temporary status
    await queryRunner.query(
      `UPDATE "user" SET "status_temp" = 'temporary_activated' WHERE "status" = 'active'`,
    );
    await queryRunner.query(
      `UPDATE "user" SET "status_temp" = "status"::text WHERE "status" != 'active'`,
    );

    // Step 3: Drop the existing ENUM type and the status column
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."user_status_enum"`);

    // Step 4: Create the new ENUM type
    await queryRunner.query(
      `CREATE TYPE "public"."user_status_enum" AS ENUM('activated', 'monitored', 'banned', 'deactivated')`,
    );

    // Step 5: Add the status column back with the new ENUM type
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN "status" "public"."user_status_enum" DEFAULT 'activated'`,
    );

    // Step 6: Copy values from the temporary column back to the status column
    await queryRunner.query(
      `UPDATE "user" SET "status" = 'activated' WHERE "status_temp" = 'temporary_activated'`,
    );
    await queryRunner.query(
      `UPDATE "user" SET "status" = "status_temp"::"public"."user_status_enum" WHERE "status_temp" != 'temporary_activated'`,
    );

    // Step 7: Drop the temporary column
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "status_temp"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add a temporary column to store the string value of status
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "status_temp" text`);
    await queryRunner.query(`UPDATE "user" SET "status_temp" = "status"::text`);

    // Step 2: Drop the existing ENUM type and the status column
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."user_status_enum"`);

    // Step 3: Create the old ENUM type
    await queryRunner.query(
      `CREATE TYPE "public"."user_status_enum" AS ENUM('active', 'monitored', 'banned')`,
    );

    // Step 4: Add the status column back with the old ENUM type
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN "status" "public"."user_status_enum" DEFAULT 'active'`,
    );

    // Step 5: Copy values from the temporary column back to the status column
    await queryRunner.query(
      `UPDATE "user" SET "status" = 'active' WHERE "status_temp" = 'activated'`,
    );
    await queryRunner.query(
      `UPDATE "user" SET "status" = "status_temp"::"public"."user_status_enum" WHERE "status_temp" != 'activated'`,
    );

    // Step 6: Drop the temporary column
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "status_temp"`);
  }
}
