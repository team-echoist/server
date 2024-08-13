import { MigrationInterface, QueryRunner } from 'typeorm';

export class Device1719669816581 implements MigrationInterface {
  name = 'Device1719669816581';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "device" ("id" SERIAL NOT NULL, "device_id" character varying NOT NULL, "device_token" character varying NOT NULL, "created_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "UQ_17d554d4f6b44ff0e200ee4b920" UNIQUE ("device_id"), CONSTRAINT "PK_2dc10972aa4e27c01378dad2c72" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_17d554d4f6b44ff0e200ee4b92" ON "device" ("device_id") `,
    );
    await queryRunner.query(`ALTER TABLE "alert_settings" ADD "device_id" character varying`);
    await queryRunner.query(
      `ALTER TABLE "alert_settings" ADD CONSTRAINT "UQ_793aefbc2b5fa2ae79f54720e53" UNIQUE ("device_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_793aefbc2b5fa2ae79f54720e5" ON "alert_settings" ("device_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "device" ADD CONSTRAINT "FK_9eb58b0b777dbc2864820228ebc" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" DROP CONSTRAINT "FK_9eb58b0b777dbc2864820228ebc"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_793aefbc2b5fa2ae79f54720e5"`);
    await queryRunner.query(
      `ALTER TABLE "alert_settings" DROP CONSTRAINT "UQ_793aefbc2b5fa2ae79f54720e53"`,
    );
    await queryRunner.query(`ALTER TABLE "alert_settings" DROP COLUMN "device_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_17d554d4f6b44ff0e200ee4b92"`);
    await queryRunner.query(`DROP TABLE "device"`);
  }
}
