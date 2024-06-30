import { MigrationInterface, QueryRunner } from 'typeorm';

export class Alert1719737055319 implements MigrationInterface {
  name = 'Alert1719737055319';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "alert" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "content" character varying NOT NULL, "read" boolean NOT NULL DEFAULT false, "created_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" integer, CONSTRAINT "PK_ad91cad659a3536465d564a4b2f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert" ADD CONSTRAINT "FK_d96af921be14b11c1ef4b8d4ca6" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "alert" DROP CONSTRAINT "FK_d96af921be14b11c1ef4b8d4ca6"`);
    await queryRunner.query(`DROP TABLE "alert"`);
  }
}
