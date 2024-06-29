import { MigrationInterface, QueryRunner } from 'typeorm';

export class Settings1719662472910 implements MigrationInterface {
  name = 'Settings1719662472910';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "alert_settings" DROP CONSTRAINT "FK_26bad7861d4026bb22407614f77"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_2c56e2d80fbec75ca08537dd0de"`);
    await queryRunner.query(`ALTER TABLE "alert_settings" RENAME COLUMN "userId" TO "user_id"`);
    await queryRunner.query(
      `ALTER TABLE "user" RENAME COLUMN "alert_settings" TO "alert_settings_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" RENAME CONSTRAINT "UQ_2c56e2d80fbec75ca08537dd0de" TO "UQ_6fdc7176eff5bf8d3c58ecbd9f8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_settings" ADD CONSTRAINT "FK_24ad32484b245d33bf6944990f1" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_6fdc7176eff5bf8d3c58ecbd9f8" FOREIGN KEY ("alert_settings_id") REFERENCES "alert_settings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_6fdc7176eff5bf8d3c58ecbd9f8"`);
    await queryRunner.query(
      `ALTER TABLE "alert_settings" DROP CONSTRAINT "FK_24ad32484b245d33bf6944990f1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" RENAME CONSTRAINT "UQ_6fdc7176eff5bf8d3c58ecbd9f8" TO "UQ_2c56e2d80fbec75ca08537dd0de"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" RENAME COLUMN "alert_settings_id" TO "alert_settings"`,
    );
    await queryRunner.query(`ALTER TABLE "alert_settings" RENAME COLUMN "user_id" TO "userId"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_2c56e2d80fbec75ca08537dd0de" FOREIGN KEY ("alert_settings") REFERENCES "alert_settings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_settings" ADD CONSTRAINT "FK_26bad7861d4026bb22407614f77" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
