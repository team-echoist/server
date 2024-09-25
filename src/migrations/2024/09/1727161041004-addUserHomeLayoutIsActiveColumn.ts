import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserHomeLayoutIsActiveColumn1727161041004 implements MigrationInterface {
  name = 'AddUserHomeLayoutIsActiveColumn1727161041004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_home_layout" ADD "is_active" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_home_layout" DROP COLUMN "is_active"`);
  }
}
