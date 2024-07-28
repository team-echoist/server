import { MigrationInterface, QueryRunner } from 'typeorm';

export class Consent1722160258299 implements MigrationInterface {
  name = 'Consent1722160258299';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "location_consent" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "marketing_consent" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "marketing_consent"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "location_consent"`);
  }
}
