import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeviceTokenIsUnique1722990775305 implements MigrationInterface {
  name = 'DeviceTokenIsUnique1722990775305';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" ADD CONSTRAINT "UQ_17d554d4f6b44ff0e200ee4b920" UNIQUE ("device_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" DROP CONSTRAINT "UQ_17d554d4f6b44ff0e200ee4b920"`,
    );
  }
}
