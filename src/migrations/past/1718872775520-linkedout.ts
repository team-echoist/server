import { MigrationInterface, QueryRunner } from 'typeorm';

export class Linkedout1718872775520 implements MigrationInterface {
  name = 'Linkedout1718872775520';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "status" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "status" DROP NOT NULL`);
  }
}
