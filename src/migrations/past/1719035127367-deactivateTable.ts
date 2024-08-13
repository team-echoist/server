import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeactivateTable1719035127367 implements MigrationInterface {
  name = 'DeactivateTable1719035127367';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "deactivation_reason" ("id" SERIAL NOT NULL, "reason" text NOT NULL, "created_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_ab8ebe853044520c207975f4054" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "deactivation_reason" ADD CONSTRAINT "FK_6b7ce7fb06639dcd5f3b1eb9ae9" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "deactivation_reason" DROP CONSTRAINT "FK_6b7ce7fb06639dcd5f3b1eb9ae9"`,
    );
    await queryRunner.query(`DROP TABLE "deactivation_reason"`);
  }
}
