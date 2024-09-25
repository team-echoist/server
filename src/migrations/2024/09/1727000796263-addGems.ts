import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGems1727000796263 implements MigrationInterface {
  name = 'AddGems1727000796263';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD "gems" integer NOT NULL DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "item" ADD "theme_id" integer`);
    await queryRunner.query(
      `ALTER TABLE "item" ADD CONSTRAINT "FK_3024260cc9f08c1fc8b068b6034" FOREIGN KEY ("theme_id") REFERENCES "theme"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "item" DROP CONSTRAINT "FK_3024260cc9f08c1fc8b068b6034"`);
    await queryRunner.query(`ALTER TABLE "item" DROP COLUMN "theme_id"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "gems"`);
  }
}
