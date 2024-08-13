import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUserForegin1723476722816 implements MigrationInterface {
  name = 'UpdateUserForegin1723476722816';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "seen_notice" DROP CONSTRAINT "FK_f2398bcd166fac5eff8257b27f0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "seen_notice" ADD CONSTRAINT "FK_f2398bcd166fac5eff8257b27f0" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "seen_notice" DROP CONSTRAINT "FK_f2398bcd166fac5eff8257b27f0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "seen_notice" ADD CONSTRAINT "FK_f2398bcd166fac5eff8257b27f0" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
