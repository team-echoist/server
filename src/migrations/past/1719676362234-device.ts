import { MigrationInterface, QueryRunner } from 'typeorm';

export class Device1719676362234 implements MigrationInterface {
  name = 'Device1719676362234';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "alert_settings" DROP COLUMN "published"`);
    await queryRunner.query(`ALTER TABLE "alert_settings" DROP COLUMN "linkedout"`);
    await queryRunner.query(
      `ALTER TABLE "alert_settings" ADD "viewed" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "alert_settings" ALTER COLUMN "report" SET DEFAULT false`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "alert_settings" ALTER COLUMN "report" SET DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "alert_settings" DROP COLUMN "viewed"`);
    await queryRunner.query(
      `ALTER TABLE "alert_settings" ADD "linkedout" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_settings" ADD "published" boolean NOT NULL DEFAULT true`,
    );
  }
}
