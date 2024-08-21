import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatedSeenReleaseEntity1724253927044 implements MigrationInterface {
  name = 'CreatedSeenReleaseEntity1724253927044';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "seen_release" ("id" SERIAL NOT NULL, "last_checked" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" integer, CONSTRAINT "PK_5b221e945f414845ff73fa11acb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "seen_release" ADD CONSTRAINT "FK_ebe13ea72dd265bf780c81f44ab" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "seen_release" DROP CONSTRAINT "FK_ebe13ea72dd265bf780c81f44ab"`,
    );
    await queryRunner.query(`DROP TABLE "seen_release"`);
  }
}
