import { MigrationInterface, QueryRunner } from 'typeorm';

export class Inquiry1719373415919 implements MigrationInterface {
  name = 'Inquiry1719373415919';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "inquiry" ADD "type" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "inquiry" ADD "title" character varying NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "inquiry" DROP COLUMN "title"`);
    await queryRunner.query(`ALTER TABLE "inquiry" DROP COLUMN "type"`);
  }
}
