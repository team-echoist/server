import { MigrationInterface, QueryRunner } from 'typeorm';

export class Linkedout1718243963556 implements MigrationInterface {
  name = 'Linkedout1718243963556';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD "reputation" integer NOT NULL DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "essay" ADD "trend_score" integer NOT NULL DEFAULT '0'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "essay" DROP COLUMN "trend_score"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "reputation"`);
  }
}
