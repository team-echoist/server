import { MigrationInterface, QueryRunner } from 'typeorm';

export class EstablishRelationshipBetweenDeviceAndNotificationSettings1723102462681
  implements MigrationInterface
{
  name = 'EstablishRelationshipBetweenDeviceAndNotificationSettings1723102462681';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_17d554d4f6b44ff0e200ee4b92"`);
    await queryRunner.query(`ALTER TABLE "device" DROP COLUMN "device_token"`);
    await queryRunner.query(
      `ALTER TABLE "device" DROP CONSTRAINT "UQ_17d554d4f6b44ff0e200ee4b920"`,
    );
    await queryRunner.query(`ALTER TABLE "device" DROP COLUMN "device_id"`);
    await queryRunner.query(`ALTER TABLE "device" ADD "uid" character varying`);
    await queryRunner.query(`ALTER TABLE "device" ADD "fcm_token" character varying`);
    await queryRunner.query(`DROP INDEX "public"."IDX_793aefbc2b5fa2ae79f54720e5"`);
    await queryRunner.query(`ALTER TABLE "alert_settings" DROP COLUMN "device_id"`);
    await queryRunner.query(`ALTER TABLE "alert_settings" ADD "device_id" integer`);
    await queryRunner.query(`CREATE INDEX "IDX_a8292247ac30c9264a6214d1a6" ON "device" ("uid") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_793aefbc2b5fa2ae79f54720e5" ON "alert_settings" ("device_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_settings" ADD CONSTRAINT "FK_793aefbc2b5fa2ae79f54720e53" FOREIGN KEY ("device_id") REFERENCES "device"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "alert_settings" DROP CONSTRAINT "FK_793aefbc2b5fa2ae79f54720e53"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_793aefbc2b5fa2ae79f54720e5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a8292247ac30c9264a6214d1a6"`);
    await queryRunner.query(`ALTER TABLE "alert_settings" DROP COLUMN "device_id"`);
    await queryRunner.query(
      `ALTER TABLE "alert_settings" ADD "device_id" character varying NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_793aefbc2b5fa2ae79f54720e5" ON "alert_settings" ("device_id") `,
    );
    await queryRunner.query(`ALTER TABLE "device" DROP COLUMN "fcm_token"`);
    await queryRunner.query(`ALTER TABLE "device" DROP COLUMN "uid"`);
    await queryRunner.query(`ALTER TABLE "device" ADD "device_id" character varying`);
    await queryRunner.query(
      `ALTER TABLE "device" ADD CONSTRAINT "UQ_17d554d4f6b44ff0e200ee4b920" UNIQUE ("device_id")`,
    );
    await queryRunner.query(`ALTER TABLE "device" ADD "device_token" character varying`);
    await queryRunner.query(
      `CREATE INDEX "IDX_17d554d4f6b44ff0e200ee4b92" ON "device" ("device_id") `,
    );
  }
}
