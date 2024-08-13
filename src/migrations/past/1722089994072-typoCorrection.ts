import { MigrationInterface, QueryRunner } from 'typeorm';

export class TypoCorrection1722089994072 implements MigrationInterface {
  name = 'TypoCorrection1722089994072';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "geulroquis" ("id" SERIAL NOT NULL, "url" character varying NOT NULL, "current" boolean NOT NULL DEFAULT false, "next" boolean NOT NULL DEFAULT false, "provided" boolean NOT NULL DEFAULT false, " provided_date" TIMESTAMP WITH TIME ZONE, "created_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_42a8e2f3d3d27c08e1066ff2130" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`DROP TABLE "guleroquis"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "geulroquis"`);
  }
}
