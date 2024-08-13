import { MigrationInterface, QueryRunner } from 'typeorm';

export class Consent1722495597140 implements MigrationInterface {
  name = 'Consent1722495597140';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "marketing_consent"`);
    await queryRunner.query(
      `ALTER TABLE "alert_settings" ADD "marketing" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "alert_settings" DROP COLUMN "marketing"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "marketing_consent" boolean NOT NULL DEFAULT false`,
    );
  }
}
