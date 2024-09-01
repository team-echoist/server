import { MigrationInterface, QueryRunner } from 'typeorm';

export class Aggregate1725180514109 implements MigrationInterface {
  name = 'Aggregate1725180514109';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "sync_status" ("id" SERIAL NOT NULL, "last_sync" TIMESTAMP NOT NULL, CONSTRAINT "PK_86336482262ab8d5b548a4a71b7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "aggregate" ADD "user_id" integer NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "aggregate" DROP COLUMN "user_id"`);
    await queryRunner.query(`DROP TABLE "sync_status"`);
  }
}
