import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixGeulroquisEntity1723614729256 implements MigrationInterface {
  name = 'FixGeulroquisEntity1723614729256';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "geulroquis" RENAME COLUMN " provided_date" TO "provided_date"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "geulroquis" RENAME COLUMN "provided_date" TO " provided_date"`,
    );
  }
}
