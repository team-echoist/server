import { MigrationInterface, QueryRunner } from 'typeorm';

export class Notifications1719210897286 implements MigrationInterface {
  name = 'Notifications1719210897286';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "view"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "notification" ADD "view" integer NOT NULL`);
  }
}
