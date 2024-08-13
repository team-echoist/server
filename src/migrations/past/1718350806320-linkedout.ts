import { MigrationInterface, QueryRunner } from 'typeorm';

export class Linkedout1718350806320 implements MigrationInterface {
  name = 'Linkedout1718350806320';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "essay" ALTER COLUMN "trend_score" SET DEFAULT '50'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "essay" ALTER COLUMN "trend_score" SET DEFAULT '0'`);
  }
}
