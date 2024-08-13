import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRcordNnoticeRelationship1719238061875 implements MigrationInterface {
  name = 'AddRcordNnoticeRelationship1719238061875';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "processed_history" ADD "notice_id" integer`);
    await queryRunner.query(
      `ALTER TABLE "processed_history" ADD CONSTRAINT "FK_294fefbfa09f2f019431f48a636" FOREIGN KEY ("notice_id") REFERENCES "notice"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "processed_history" DROP CONSTRAINT "FK_294fefbfa09f2f019431f48a636"`,
    );
    await queryRunner.query(`ALTER TABLE "processed_history" DROP COLUMN "notice_id"`);
  }
}
