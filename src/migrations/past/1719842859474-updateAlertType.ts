import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAlertType1719842859474 implements MigrationInterface {
  name = 'UpdateAlertType1719842859474';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."alert_type_enum" RENAME TO "alert_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."alert_type_enum" AS ENUM('published', 'linkedout', 'updated')`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert" ALTER COLUMN "type" TYPE "public"."alert_type_enum" USING "type"::"text"::"public"."alert_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."alert_type_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."alert_type_enum_old" AS ENUM('published', 'linkedout', 'report')`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert" ALTER COLUMN "type" TYPE "public"."alert_type_enum_old" USING "type"::"text"::"public"."alert_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."alert_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."alert_type_enum_old" RENAME TO "alert_type_enum"`,
    );
  }
}
