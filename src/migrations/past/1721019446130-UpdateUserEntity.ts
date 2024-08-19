import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUserEntity1721019446130 implements MigrationInterface {
  name = 'UpdateUserEntity1721019446130';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "oauth_info"`);
    await queryRunner.query(`ALTER TABLE "user" ADD "platform" character varying`);
    await queryRunner.query(`ALTER TABLE "user" ADD "platform_id" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "platform_id"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "platform"`);
    await queryRunner.query(`ALTER TABLE "user" ADD "oauth_info" jsonb`);
  }
}
