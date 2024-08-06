import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateServerStatus1722871194052 implements MigrationInterface {
  name = 'CreateServerStatus1722871194052';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."server_status_enum" AS ENUM('open', 'maintenance', 'closed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "server" ("id" SERIAL NOT NULL, "status" "public"."server_status_enum" NOT NULL DEFAULT 'open', "updated_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_f8b8af38bdc23b447c0a57c7937" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "server"`);
    await queryRunner.query(`DROP TYPE "public"."server_status_enum"`);
  }
}
