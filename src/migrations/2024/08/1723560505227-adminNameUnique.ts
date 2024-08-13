import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdminNameUnique1723560505227 implements MigrationInterface {
  name = 'AdminNameUnique1723560505227';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "admin" ADD CONSTRAINT "UQ_a026be7ca12f8999cbdf96dec20" UNIQUE ("name")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "admin" DROP CONSTRAINT "UQ_a026be7ca12f8999cbdf96dec20"`);
  }
}
