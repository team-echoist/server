import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserEamil1722020266671 implements MigrationInterface {
  name = 'UserEamil1722020266671';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "email" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "email" SET NOT NULL`);
  }
}
