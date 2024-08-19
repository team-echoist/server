import { MigrationInterface, QueryRunner } from 'typeorm';

export class Linkedout1718392341913 implements MigrationInterface {
  name = 'Linkedout1718392341913';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bookmark" DROP CONSTRAINT "FK_09cbf5caaaae3343b2cd8e00f57"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookmark" ADD CONSTRAINT "FK_09cbf5caaaae3343b2cd8e00f57" FOREIGN KEY ("essayId") REFERENCES "essay"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bookmark" DROP CONSTRAINT "FK_09cbf5caaaae3343b2cd8e00f57"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookmark" ADD CONSTRAINT "FK_09cbf5caaaae3343b2cd8e00f57" FOREIGN KEY ("essayId") REFERENCES "essay"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
