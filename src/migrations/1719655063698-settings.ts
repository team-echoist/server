import { MigrationInterface, QueryRunner } from 'typeorm';

export class Settings1719655063698 implements MigrationInterface {
  name = 'Settings1719655063698';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "alert_settings" ("id" SERIAL NOT NULL, "alertOnNewPost" boolean NOT NULL DEFAULT false, "alertOnLinkedOut" boolean NOT NULL DEFAULT false, "alertOnReportComplete" boolean NOT NULL DEFAULT false, "alertTimeStart" TIME, "alertTimeEnd" TIME, "userId" integer, CONSTRAINT "REL_26bad7861d4026bb22407614f7" UNIQUE ("userId"), CONSTRAINT "PK_9f318561ba481069150ca1fff62" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "user" ADD "alert_settings" integer`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "UQ_2c56e2d80fbec75ca08537dd0de" UNIQUE ("alert_settings")`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_settings" ADD CONSTRAINT "FK_26bad7861d4026bb22407614f77" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_2c56e2d80fbec75ca08537dd0de" FOREIGN KEY ("alert_settings") REFERENCES "alert_settings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_2c56e2d80fbec75ca08537dd0de"`);
    await queryRunner.query(
      `ALTER TABLE "alert_settings" DROP CONSTRAINT "FK_26bad7861d4026bb22407614f77"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_2c56e2d80fbec75ca08537dd0de"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "alert_settings"`);
    await queryRunner.query(`DROP TABLE "alert_settings"`);
  }
}
