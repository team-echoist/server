import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixAlertSettings1719962956994 implements MigrationInterface {
  name = 'FixAlertSettings1719962956994';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "alert_settings" DROP COLUMN "time_allowed"`);
    await queryRunner.query(`ALTER TABLE "alert_settings" DROP COLUMN "alert_start"`);
    await queryRunner.query(`ALTER TABLE "alert_settings" DROP COLUMN "alert_end"`);
    await queryRunner.query(`ALTER TABLE "alert_settings" ALTER COLUMN "device_id" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "alert_settings" ALTER COLUMN "device_id" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "alert_settings" ADD "alert_end" TIME`);
    await queryRunner.query(`ALTER TABLE "alert_settings" ADD "alert_start" TIME`);
    await queryRunner.query(
      `ALTER TABLE "alert_settings" ADD "time_allowed" boolean NOT NULL DEFAULT false`,
    );
  }
}
