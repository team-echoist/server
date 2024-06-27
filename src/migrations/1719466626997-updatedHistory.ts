import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdatedHistory1719466626997 implements MigrationInterface {
  name = 'UpdatedHistory1719466626997';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "updated_history" ("id" SERIAL NOT NULL, "history" character varying NOT NULL, "created_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "admin_id" integer, CONSTRAINT "PK_2a719da2becc7df4432d09d462f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "updated_history" ADD CONSTRAINT "FK_a32790492a759b5b799efb9ce60" FOREIGN KEY ("admin_id") REFERENCES "admin"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "updated_history" DROP CONSTRAINT "FK_a32790492a759b5b799efb9ce60"`,
    );
    await queryRunner.query(`DROP TABLE "updated_history"`);
  }
}
