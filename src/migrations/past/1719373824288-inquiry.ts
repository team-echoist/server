import { MigrationInterface, QueryRunner } from 'typeorm';

export class Inquiry1719373824288 implements MigrationInterface {
  name = 'Inquiry1719373824288';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "inquiry" RENAME COLUMN "contents" TO "content"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "inquiry" RENAME COLUMN "content" TO "contents"`);
  }
}
