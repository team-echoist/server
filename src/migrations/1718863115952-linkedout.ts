import { MigrationInterface, QueryRunner } from 'typeorm';

export class Linkedout1718863115952 implements MigrationInterface {
  name = 'Linkedout1718863115952';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "admin" RENAME COLUMN "active" TO "activated"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "admin" RENAME COLUMN "activated" TO "active"`);
  }
}
