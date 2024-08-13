import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReleaseTable1723576331533 implements MigrationInterface {
  name = 'ReleaseTable1723576331533';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "release" ("id" SERIAL NOT NULL, "content" character varying NOT NULL, "created_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "admin_id" integer, CONSTRAINT "PK_1a2253436964eea9c558f9464f4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "release" ADD CONSTRAINT "FK_d36ea454fc58ace72180dcaa396" FOREIGN KEY ("admin_id") REFERENCES "admin"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "release" DROP CONSTRAINT "FK_d36ea454fc58ace72180dcaa396"`,
    );
    await queryRunner.query(`DROP TABLE "release"`);
  }
}
