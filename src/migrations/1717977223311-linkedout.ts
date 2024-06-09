import { MigrationInterface, QueryRunner } from "typeorm";

export class Linkedout1717977223311 implements MigrationInterface {
    name = 'Linkedout1717977223311'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "bookmark" ("id" SERIAL NOT NULL, "createdDate" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, "essayId" integer, CONSTRAINT "PK_b7fbf4a865ba38a590bb9239814" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "essay" DROP COLUMN "bookmarks"`);
        await queryRunner.query(`ALTER TABLE "bookmark" ADD CONSTRAINT "FK_e389fc192c59bdce0847ef9ef8b" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookmark" ADD CONSTRAINT "FK_09cbf5caaaae3343b2cd8e00f57" FOREIGN KEY ("essayId") REFERENCES "essay"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bookmark" DROP CONSTRAINT "FK_09cbf5caaaae3343b2cd8e00f57"`);
        await queryRunner.query(`ALTER TABLE "bookmark" DROP CONSTRAINT "FK_e389fc192c59bdce0847ef9ef8b"`);
        await queryRunner.query(`ALTER TABLE "essay" ADD "bookmarks" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`DROP TABLE "bookmark"`);
    }

}
