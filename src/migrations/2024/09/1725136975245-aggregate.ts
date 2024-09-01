import { MigrationInterface, QueryRunner } from 'typeorm';

export class Aggregate1725136975245 implements MigrationInterface {
  name = 'Aggregate1725136975245';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "aggregate" ("essay_id" integer NOT NULL, "total_views" integer NOT NULL DEFAULT '0', "reputation_score" integer NOT NULL DEFAULT '0', "trend_score" integer NOT NULL DEFAULT '0', "updated_date" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_de7a1e13ecd137a3d5fa40600f7" PRIMARY KEY ("essay_id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "aggregate"`);
  }
}
