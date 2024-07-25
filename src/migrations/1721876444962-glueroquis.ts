import { MigrationInterface, QueryRunner } from 'typeorm';

export class Glueroquis1721876444962 implements MigrationInterface {
  name = 'Glueroquis1721876444962';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "guleroquis" ("id" SERIAL NOT NULL, "url" character varying NOT NULL, "provided" boolean NOT NULL DEFAULT false, "provided_date" TIMESTAMP NOT NULL, "current" boolean NOT NULL DEFAULT false, "next" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_df673ed461b23ecab1f5a8863ee" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "guleroquis"`);
  }
}
