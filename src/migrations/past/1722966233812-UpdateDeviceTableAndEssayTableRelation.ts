import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateDeviceTableAndEssayTableRelation1722966233812 implements MigrationInterface {
  name = 'UpdateDeviceTableAndEssayTableRelation1722966233812';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_a6b7d391cdc7a95d239db581a0"`);
    await queryRunner.query(`ALTER TABLE "essay" RENAME COLUMN "device" TO "deviceId"`);
    await queryRunner.query(`ALTER TABLE "essay" DROP COLUMN "deviceId"`);
    await queryRunner.query(`ALTER TABLE "essay" ADD "deviceId" integer`);
    await queryRunner.query(
      `ALTER TABLE "essay" ADD CONSTRAINT "FK_6bc8a83cf679bba24c15af891b5" FOREIGN KEY ("deviceId") REFERENCES "device"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "essay" DROP CONSTRAINT "FK_6bc8a83cf679bba24c15af891b5"`);
    await queryRunner.query(`ALTER TABLE "essay" DROP COLUMN "deviceId"`);
    await queryRunner.query(`ALTER TABLE "essay" ADD "deviceId" character varying`);
    await queryRunner.query(`ALTER TABLE "essay" RENAME COLUMN "deviceId" TO "device"`);
    await queryRunner.query(`CREATE INDEX "IDX_a6b7d391cdc7a95d239db581a0" ON "essay" ("device") `);
  }
}
