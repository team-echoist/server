import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTokenVersionToUser1724517395953 implements MigrationInterface {
  name = 'AddTokenVersionToUser1724517395953';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD "token_version" integer NOT NULL DEFAULT '1'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "token_version"`);
  }
}
