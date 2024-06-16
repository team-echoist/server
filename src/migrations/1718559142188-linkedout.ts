import { MigrationInterface, QueryRunner } from 'typeorm';

export class Linkedout1718559142188 implements MigrationInterface {
  name = 'Linkedout1718559142188';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bookmark" DROP CONSTRAINT "FK_09cbf5caaaae3343b2cd8e00f57"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookmark" DROP CONSTRAINT "FK_e389fc192c59bdce0847ef9ef8b"`,
    );
    await queryRunner.query(`ALTER TABLE "bookmark" DROP COLUMN "userId"`);
    await queryRunner.query(`ALTER TABLE "bookmark" DROP COLUMN "essayId"`);
    await queryRunner.query(`ALTER TABLE "bookmark" ADD "user_id" integer`);
    await queryRunner.query(`ALTER TABLE "bookmark" ADD "essay_id" integer`);
    await queryRunner.query(
      `ALTER TABLE "bookmark" ADD CONSTRAINT "FK_8f1a143c6ba8bba0e2a4f41e0d0" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookmark" ADD CONSTRAINT "FK_8b04d9eeb5722c4195babecb4d2" FOREIGN KEY ("essay_id") REFERENCES "essay"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bookmark" DROP CONSTRAINT "FK_8b04d9eeb5722c4195babecb4d2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookmark" DROP CONSTRAINT "FK_8f1a143c6ba8bba0e2a4f41e0d0"`,
    );
    await queryRunner.query(`ALTER TABLE "bookmark" DROP COLUMN "essay_id"`);
    await queryRunner.query(`ALTER TABLE "bookmark" DROP COLUMN "user_id"`);
    await queryRunner.query(`ALTER TABLE "bookmark" ADD "essayId" integer`);
    await queryRunner.query(`ALTER TABLE "bookmark" ADD "userId" integer`);
    await queryRunner.query(
      `ALTER TABLE "bookmark" ADD CONSTRAINT "FK_e389fc192c59bdce0847ef9ef8b" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookmark" ADD CONSTRAINT "FK_09cbf5caaaae3343b2cd8e00f57" FOREIGN KEY ("essayId") REFERENCES "essay"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
