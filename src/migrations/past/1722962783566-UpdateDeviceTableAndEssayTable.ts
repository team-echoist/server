import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateDeviceTableAndEssayTable1722962783566 implements MigrationInterface {
  name = 'UpdateDeviceTableAndEssayTable1722962783566';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_3dc6bb9e51d6d397d04bc83058"`);
    await queryRunner.query(`ALTER TABLE "essay" RENAME COLUMN "device_info" TO "device"`);
    await queryRunner.query(
      `CREATE TYPE "public"."device_os_enum" AS ENUM('Window', 'Mac', 'Android', 'iOS', 'Linux', 'Unknown')`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" ADD "os" "public"."device_os_enum" NOT NULL DEFAULT 'Unknown'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."device_type_enum" AS ENUM('Desktop', 'Laptop', 'Mobile', 'Tablet', 'Unknown')`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" ADD "type" "public"."device_type_enum" NOT NULL DEFAULT 'Unknown'`,
    );
    await queryRunner.query(`ALTER TABLE "device" ADD "model" character varying`);
    await queryRunner.query(`ALTER TABLE "device" ALTER COLUMN "device_id" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "device" DROP CONSTRAINT "UQ_17d554d4f6b44ff0e200ee4b920"`,
    );
    await queryRunner.query(`ALTER TABLE "device" ALTER COLUMN "device_token" DROP NOT NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_a6b7d391cdc7a95d239db581a0" ON "essay" ("device") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_a6b7d391cdc7a95d239db581a0"`);
    await queryRunner.query(`ALTER TABLE "device" ALTER COLUMN "device_token" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "device" ADD CONSTRAINT "UQ_17d554d4f6b44ff0e200ee4b920" UNIQUE ("device_id")`,
    );
    await queryRunner.query(`ALTER TABLE "device" ALTER COLUMN "device_id" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "device" DROP COLUMN "model"`);
    await queryRunner.query(`ALTER TABLE "device" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."device_type_enum"`);
    await queryRunner.query(`ALTER TABLE "device" DROP COLUMN "os"`);
    await queryRunner.query(`DROP TYPE "public"."device_os_enum"`);
    await queryRunner.query(`ALTER TABLE "essay" RENAME COLUMN "device" TO "device_info"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_3dc6bb9e51d6d397d04bc83058" ON "essay" ("device_info") `,
    );
  }
}
