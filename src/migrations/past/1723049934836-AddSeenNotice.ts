import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSeenNotice1723049934836 implements MigrationInterface {
  name = 'AddSeenNotice1723049934836';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "seen_notice" ("id" SERIAL NOT NULL, "updated_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" integer, "notice_id" integer, CONSTRAINT "PK_904f02ba3184c2927ce84eaf62d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "seen_notice" ADD CONSTRAINT "FK_f2398bcd166fac5eff8257b27f0" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "seen_notice" ADD CONSTRAINT "FK_c499d4d8e7051529e91176f8cd8" FOREIGN KEY ("notice_id") REFERENCES "notice"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "seen_notice" DROP CONSTRAINT "FK_c499d4d8e7051529e91176f8cd8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "seen_notice" DROP CONSTRAINT "FK_f2398bcd166fac5eff8257b27f0"`,
    );
    await queryRunner.query(`DROP TABLE "seen_notice"`);
  }
}
