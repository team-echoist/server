import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlertSetting1722673070504 implements MigrationInterface {
  name = 'AlertSetting1722673070504';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_6fdc7176eff5bf8d3c58ecbd9f8"`);
    await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_6fdc7176eff5bf8d3c58ecbd9f8"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "alert_settings_id"`);
    await queryRunner.query(
      `ALTER TABLE "alert_settings" DROP CONSTRAINT "FK_24ad32484b245d33bf6944990f1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_settings" DROP CONSTRAINT "REL_26bad7861d4026bb22407614f7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_settings" ADD CONSTRAINT "FK_24ad32484b245d33bf6944990f1" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "alert_settings" DROP CONSTRAINT "FK_24ad32484b245d33bf6944990f1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_settings" ADD CONSTRAINT "REL_26bad7861d4026bb22407614f7" UNIQUE ("user_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_settings" ADD CONSTRAINT "FK_24ad32484b245d33bf6944990f1" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE "user" ADD "alert_settings_id" integer`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "UQ_6fdc7176eff5bf8d3c58ecbd9f8" UNIQUE ("alert_settings_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_6fdc7176eff5bf8d3c58ecbd9f8" FOREIGN KEY ("alert_settings_id") REFERENCES "alert_settings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
