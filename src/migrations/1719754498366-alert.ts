import { MigrationInterface, QueryRunner } from 'typeorm';

export class Alert1719754498366 implements MigrationInterface {
  name = 'Alert1719754498366';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "alert" ADD "body" character varying`);
    await queryRunner.query(
      `CREATE TYPE "public"."alert_type_enum" AS ENUM('published', 'linkedout', 'report')`,
    );
    await queryRunner.query(`ALTER TABLE "alert" ADD "type" "public"."alert_type_enum"`);
    await queryRunner.query(`ALTER TABLE "alert" ALTER COLUMN "content" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "alert" ALTER COLUMN "content" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "alert" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."alert_type_enum"`);
    await queryRunner.query(`ALTER TABLE "alert" DROP COLUMN "body"`);
  }
}
