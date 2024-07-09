import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdatedAlertEntity1720489881878 implements MigrationInterface {
  name = 'UpdatedAlertEntity1720489881878';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "alert" ADD "essay_id" integer`);
    await queryRunner.query(
      `ALTER TABLE "alert" ADD CONSTRAINT "FK_821361199a7b45d5579fa845fc4" FOREIGN KEY ("essay_id") REFERENCES "essay"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "alert" DROP CONSTRAINT "FK_821361199a7b45d5579fa845fc4"`);
    await queryRunner.query(`ALTER TABLE "alert" DROP COLUMN "essay_id"`);
  }
}
