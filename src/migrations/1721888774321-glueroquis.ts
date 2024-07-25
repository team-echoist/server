import { MigrationInterface, QueryRunner } from 'typeorm';

export class Glueroquis1721888774321 implements MigrationInterface {
  name = 'Glueroquis1721888774321';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "guleroquis" DROP COLUMN "provided_date"`);
    await queryRunner.query(
      `ALTER TABLE "guleroquis" ADD " provided_date" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "guleroquis" ADD "created_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "guleroquis" DROP COLUMN "created_date"`);
    await queryRunner.query(`ALTER TABLE "guleroquis" DROP COLUMN " provided_date"`);
    await queryRunner.query(`ALTER TABLE "guleroquis" ADD "provided_date" TIMESTAMP NOT NULL`);
  }
}
