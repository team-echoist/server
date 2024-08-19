import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUserCascade1720953725540 implements MigrationInterface {
  name = 'UpdateUserCascade1720953725540';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "view_record" DROP CONSTRAINT "FK_978673523b1947c859ef95f627c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "view_record" ADD CONSTRAINT "FK_978673523b1947c859ef95f627c" FOREIGN KEY ("essay_id") REFERENCES "essay"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "view_record" DROP CONSTRAINT "FK_978673523b1947c859ef95f627c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "view_record" ADD CONSTRAINT "FK_978673523b1947c859ef95f627c" FOREIGN KEY ("essay_id") REFERENCES "essay"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
