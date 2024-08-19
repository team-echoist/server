import { MigrationInterface, QueryRunner } from 'typeorm';

export class Linkedout1719027411752 implements MigrationInterface {
  name = 'Linkedout1719027411752';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "processed_history" DROP CONSTRAINT "FK_6521bddfe8435d4d84114ac0820"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."reviewQueue_type_enum" AS ENUM('linkedout', 'published')`,
    );
    await queryRunner.query(
      `CREATE TABLE "reviewQueue" ("id" SERIAL NOT NULL, "type" "public"."reviewQueue_type_enum" NOT NULL, "processed" boolean NOT NULL DEFAULT false, "created_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "processed_date" TIMESTAMP WITH TIME ZONE, "essay_id" integer, "user_id" integer, CONSTRAINT "PK_adbd653a3eab8c98f6c2901ca25" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_581f768391877f20f635918d2b" ON "reviewQueue" ("processed") `,
    );
    await queryRunner.query(
      `CREATE TABLE "cron_log" ("id" SERIAL NOT NULL, "taskName" character varying(255) NOT NULL, "start_time" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "end_time" TIMESTAMP WITH TIME ZONE, "status" character varying(50) NOT NULL, "message" text, CONSTRAINT "PK_3cad307b59feb060aa1f175646b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "status" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "reviewQueue" ADD CONSTRAINT "FK_51c8d16a3a749510f178eb00779" FOREIGN KEY ("essay_id") REFERENCES "essay"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviewQueue" ADD CONSTRAINT "FK_4ad0dc1482cd3472270465d2282" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" ADD CONSTRAINT "FK_6521bddfe8435d4d84114ac0820" FOREIGN KEY ("review_id") REFERENCES "reviewQueue"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "processed_history" DROP CONSTRAINT "FK_6521bddfe8435d4d84114ac0820"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviewQueue" DROP CONSTRAINT "FK_4ad0dc1482cd3472270465d2282"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviewQueue" DROP CONSTRAINT "FK_51c8d16a3a749510f178eb00779"`,
    );
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "status" DROP NOT NULL`);
    await queryRunner.query(`DROP TABLE "cron_log"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_581f768391877f20f635918d2b"`);
    await queryRunner.query(`DROP TABLE "reviewQueue"`);
    await queryRunner.query(`DROP TYPE "public"."reviewQueue_type_enum"`);
    await queryRunner.query(
      `ALTER TABLE "processed_history" ADD CONSTRAINT "FK_6521bddfe8435d4d84114ac0820" FOREIGN KEY ("review_id") REFERENCES "review_queue"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
