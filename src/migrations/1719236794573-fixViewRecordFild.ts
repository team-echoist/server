import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixViewRecordFild1719236794573 implements MigrationInterface {
  name = 'FixViewRecordFild1719236794573';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "view_record" DROP CONSTRAINT "FK_c77c486c12f09e8f831dd0927e7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "view_record" DROP CONSTRAINT "FK_32a2b1e26911a43b8846f88899e"`,
    );
    await queryRunner.query(
      `CREATE TABLE "notice" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "content" character varying NOT NULL, "created_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_date" TIMESTAMP WITH TIME ZONE, "admin_id" integer, CONSTRAINT "PK_705062b14410ff1a04998f86d72" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "view_record" DROP COLUMN "userId"`);
    await queryRunner.query(`ALTER TABLE "view_record" DROP COLUMN "essayId"`);
    await queryRunner.query(`ALTER TABLE "view_record" ADD "user_id" integer`);
    await queryRunner.query(`ALTER TABLE "view_record" ADD "essay_id" integer`);
    await queryRunner.query(
      `ALTER TABLE "notice" ADD CONSTRAINT "FK_93b424b0607d9ae07626f280f6b" FOREIGN KEY ("admin_id") REFERENCES "admin"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "view_record" ADD CONSTRAINT "FK_976e8585281e82fb7835df0cbdf" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "view_record" ADD CONSTRAINT "FK_978673523b1947c859ef95f627c" FOREIGN KEY ("essay_id") REFERENCES "essay"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "view_record" DROP CONSTRAINT "FK_978673523b1947c859ef95f627c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "view_record" DROP CONSTRAINT "FK_976e8585281e82fb7835df0cbdf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notice" DROP CONSTRAINT "FK_93b424b0607d9ae07626f280f6b"`,
    );
    await queryRunner.query(`ALTER TABLE "view_record" DROP COLUMN "essay_id"`);
    await queryRunner.query(`ALTER TABLE "view_record" DROP COLUMN "user_id"`);
    await queryRunner.query(`ALTER TABLE "view_record" ADD "essayId" integer`);
    await queryRunner.query(`ALTER TABLE "view_record" ADD "userId" integer`);
    await queryRunner.query(`DROP TABLE "notice"`);
    await queryRunner.query(
      `ALTER TABLE "view_record" ADD CONSTRAINT "FK_32a2b1e26911a43b8846f88899e" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "view_record" ADD CONSTRAINT "FK_c77c486c12f09e8f831dd0927e7" FOREIGN KEY ("essayId") REFERENCES "essay"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
