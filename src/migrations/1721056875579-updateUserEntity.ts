import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUserEntity1721056875579 implements MigrationInterface {
  name = 'UpdateUserEntity1721056875579';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD "is_first" boolean NOT NULL DEFAULT true`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "is_first"`);
  }
}
