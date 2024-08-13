import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUserCascade1720953646180 implements MigrationInterface {
  name = 'UpdateUserCascade1720953646180';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscription" DROP CONSTRAINT "FK_940d49a105d50bbd616be540013"`,
    );
    await queryRunner.query(
      `ALTER TABLE "report_queue" DROP CONSTRAINT "FK_afcf702ab14e3f4660fa57afc07"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookmark" DROP CONSTRAINT "FK_8f1a143c6ba8bba0e2a4f41e0d0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_settings" DROP CONSTRAINT "FK_24ad32484b245d33bf6944990f1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "view_record" DROP CONSTRAINT "FK_976e8585281e82fb7835df0cbdf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription" ADD CONSTRAINT "FK_940d49a105d50bbd616be540013" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "report_queue" ADD CONSTRAINT "FK_afcf702ab14e3f4660fa57afc07" FOREIGN KEY ("reporter_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookmark" ADD CONSTRAINT "FK_8f1a143c6ba8bba0e2a4f41e0d0" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_settings" ADD CONSTRAINT "FK_24ad32484b245d33bf6944990f1" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "view_record" ADD CONSTRAINT "FK_976e8585281e82fb7835df0cbdf" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "view_record" DROP CONSTRAINT "FK_976e8585281e82fb7835df0cbdf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_settings" DROP CONSTRAINT "FK_24ad32484b245d33bf6944990f1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookmark" DROP CONSTRAINT "FK_8f1a143c6ba8bba0e2a4f41e0d0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "report_queue" DROP CONSTRAINT "FK_afcf702ab14e3f4660fa57afc07"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription" DROP CONSTRAINT "FK_940d49a105d50bbd616be540013"`,
    );
    await queryRunner.query(
      `ALTER TABLE "view_record" ADD CONSTRAINT "FK_976e8585281e82fb7835df0cbdf" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_settings" ADD CONSTRAINT "FK_24ad32484b245d33bf6944990f1" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookmark" ADD CONSTRAINT "FK_8f1a143c6ba8bba0e2a4f41e0d0" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "report_queue" ADD CONSTRAINT "FK_afcf702ab14e3f4660fa57afc07" FOREIGN KEY ("reporter_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription" ADD CONSTRAINT "FK_940d49a105d50bbd616be540013" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
