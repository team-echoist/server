import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReleaseReation1723613898208 implements MigrationInterface {
  name = 'ReleaseReation1723613898208';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "processed_history" ADD "release_id" integer`);
    await queryRunner.query(
      `ALTER TABLE "processed_history" ADD CONSTRAINT "FK_3ece1dba34f4412ccd6c60ee103" FOREIGN KEY ("release_id") REFERENCES "release"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "processed_history" DROP CONSTRAINT "FK_3ece1dba34f4412ccd6c60ee103"`,
    );
    await queryRunner.query(`ALTER TABLE "processed_history" DROP COLUMN "release_id"`);
  }
}
