import { MigrationInterface, QueryRunner } from 'typeorm';

export class Inquiry1719202779199 implements MigrationInterface {
  name = 'Inquiry1719202779199';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "inquiry" ("id" SERIAL NOT NULL, "contents" character varying NOT NULL, "processed" boolean NOT NULL DEFAULT false, "processed_date" TIMESTAMP WITH TIME ZONE, "created_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" integer, "processed_history_id" integer, CONSTRAINT "REL_2c86b6913585086b83c9b7d845" UNIQUE ("processed_history_id"), CONSTRAINT "PK_3e226d0994e8bd24252dd65e1b6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9983b4f1c41e26aa5761593219" ON "inquiry" ("processed") `,
    );
    await queryRunner.query(`ALTER TABLE "processed_history" ADD "inquiry_id" integer`);
    await queryRunner.query(
      `ALTER TABLE "processed_history" ADD CONSTRAINT "UQ_2e29c87893e98a3464046937e13" UNIQUE ("inquiry_id")`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."processed_history_action_type_enum" RENAME TO "processed_history_action_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."processed_history_action_type_enum" AS ENUM('approved', 'rejected', 'pending', 'updated', 'deleted', 'unpublished', 'unlinkedout', 'published', 'linkedout', 'banned', 'monitored', 'answered')`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" ALTER COLUMN "action_type" TYPE "public"."processed_history_action_type_enum" USING "action_type"::"text"::"public"."processed_history_action_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."processed_history_action_type_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "inquiry" ADD CONSTRAINT "FK_2e53aa5aa7ddd006a62e650fe34" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inquiry" ADD CONSTRAINT "FK_2c86b6913585086b83c9b7d845c" FOREIGN KEY ("processed_history_id") REFERENCES "processed_history"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" ADD CONSTRAINT "FK_2e29c87893e98a3464046937e13" FOREIGN KEY ("inquiry_id") REFERENCES "inquiry"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "processed_history" DROP CONSTRAINT "FK_2e29c87893e98a3464046937e13"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inquiry" DROP CONSTRAINT "FK_2c86b6913585086b83c9b7d845c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inquiry" DROP CONSTRAINT "FK_2e53aa5aa7ddd006a62e650fe34"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."processed_history_action_type_enum_old" AS ENUM('approved', 'rejected', 'pending', 'updated', 'deleted', 'unpublished', 'unlinkedout', 'published', 'linkedout', 'banned', 'monitored')`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" ALTER COLUMN "action_type" TYPE "public"."processed_history_action_type_enum_old" USING "action_type"::"text"::"public"."processed_history_action_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."processed_history_action_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."processed_history_action_type_enum_old" RENAME TO "processed_history_action_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" DROP CONSTRAINT "UQ_2e29c87893e98a3464046937e13"`,
    );
    await queryRunner.query(`ALTER TABLE "processed_history" DROP COLUMN "inquiry_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9983b4f1c41e26aa5761593219"`);
    await queryRunner.query(`DROP TABLE "inquiry"`);
  }
}
