import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTagExpCascade1720953413138 implements MigrationInterface {
  name = 'UpdateTagExpCascade1720953413138';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tag_exp" DROP CONSTRAINT "FK_23706dd59a15ba43e0af3d67ca3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tag_exp" ADD CONSTRAINT "FK_23706dd59a15ba43e0af3d67ca3" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tag_exp" DROP CONSTRAINT "FK_23706dd59a15ba43e0af3d67ca3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tag_exp" ADD CONSTRAINT "FK_23706dd59a15ba43e0af3d67ca3" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
