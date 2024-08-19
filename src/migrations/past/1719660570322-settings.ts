import { MigrationInterface, QueryRunner } from 'typeorm';

export class Settings1719660570322 implements MigrationInterface {
  name = 'Settings1719660570322';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "alert_settings" DROP COLUMN "alertOnNewPost"`);
    await queryRunner.query(`ALTER TABLE "alert_settings" DROP COLUMN "alertOnLinkedOut"`);
    await queryRunner.query(`ALTER TABLE "alert_settings" DROP COLUMN "alertOnReportComplete"`);
    await queryRunner.query(`ALTER TABLE "alert_settings" DROP COLUMN "alertTimeStart"`);
    await queryRunner.query(`ALTER TABLE "alert_settings" DROP COLUMN "alertTimeEnd"`);
    await queryRunner.query(
      `ALTER TABLE "alert_settings" ADD "published" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_settings" ADD "linkedout" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_settings" ADD "report" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_settings" ADD "time_allowed" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "alert_settings" ADD "alert_start" TIME`);
    await queryRunner.query(`ALTER TABLE "alert_settings" ADD "alert_end" TIME`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "alert_settings" DROP COLUMN "alert_end"`);
    await queryRunner.query(`ALTER TABLE "alert_settings" DROP COLUMN "alert_start"`);
    await queryRunner.query(`ALTER TABLE "alert_settings" DROP COLUMN "time_allowed"`);
    await queryRunner.query(`ALTER TABLE "alert_settings" DROP COLUMN "report"`);
    await queryRunner.query(`ALTER TABLE "alert_settings" DROP COLUMN "linkedout"`);
    await queryRunner.query(`ALTER TABLE "alert_settings" DROP COLUMN "published"`);
    await queryRunner.query(`ALTER TABLE "alert_settings" ADD "alertTimeEnd" TIME`);
    await queryRunner.query(`ALTER TABLE "alert_settings" ADD "alertTimeStart" TIME`);
    await queryRunner.query(
      `ALTER TABLE "alert_settings" ADD "alertOnReportComplete" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_settings" ADD "alertOnLinkedOut" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_settings" ADD "alertOnNewPost" boolean NOT NULL DEFAULT false`,
    );
  }
}
