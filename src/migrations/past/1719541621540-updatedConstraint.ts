import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdatedConstraint1719541621540 implements MigrationInterface {
  name = 'UpdatedConstraint1719541621540';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "inquiry" DROP CONSTRAINT "FK_2c86b6913585086b83c9b7d845c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inquiry" DROP CONSTRAINT "REL_2c86b6913585086b83c9b7d845"`,
    );
    await queryRunner.query(`ALTER TABLE "inquiry" DROP COLUMN "processed_history_id"`);
    await queryRunner.query(
      `ALTER TABLE "processed_history" DROP CONSTRAINT "FK_2e29c87893e98a3464046937e13"`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" DROP CONSTRAINT "UQ_2e29c87893e98a3464046937e13"`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" ADD CONSTRAINT "FK_2e29c87893e98a3464046937e13" FOREIGN KEY ("inquiry_id") REFERENCES "inquiry"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "processed_history" DROP CONSTRAINT "FK_2e29c87893e98a3464046937e13"`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" ADD CONSTRAINT "UQ_2e29c87893e98a3464046937e13" UNIQUE ("inquiry_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" ADD CONSTRAINT "FK_2e29c87893e98a3464046937e13" FOREIGN KEY ("inquiry_id") REFERENCES "inquiry"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE "inquiry" ADD "processed_history_id" integer`);
    await queryRunner.query(
      `ALTER TABLE "inquiry" ADD CONSTRAINT "REL_2c86b6913585086b83c9b7d845" UNIQUE ("processed_history_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "inquiry" ADD CONSTRAINT "FK_2c86b6913585086b83c9b7d845c" FOREIGN KEY ("processed_history_id") REFERENCES "processed_history"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
