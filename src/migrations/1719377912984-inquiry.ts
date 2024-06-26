import { MigrationInterface, QueryRunner } from 'typeorm';

export class Inquiry1719377912984 implements MigrationInterface {
  name = 'Inquiry1719377912984';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "inquiry" ADD "answer" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "inquiry" DROP COLUMN "answer"`);
  }
}
