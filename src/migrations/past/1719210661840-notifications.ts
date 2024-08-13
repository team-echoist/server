import { MigrationInterface, QueryRunner } from 'typeorm';

export class Notifications1719210661840 implements MigrationInterface {
  name = 'Notifications1719210661840';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "notification" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "content" character varying NOT NULL, "view" integer NOT NULL, "created_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_date" TIMESTAMP WITH TIME ZONE, "admin_id" integer, CONSTRAINT "PK_705b6c7cdf9b2c2ff7ac7872cb7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification" ADD CONSTRAINT "FK_4276fe62b3f06d3c3d3abbe1054" FOREIGN KEY ("admin_id") REFERENCES "admin"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notification" DROP CONSTRAINT "FK_4276fe62b3f06d3c3d3abbe1054"`,
    );
    await queryRunner.query(`DROP TABLE "notification"`);
  }
}
