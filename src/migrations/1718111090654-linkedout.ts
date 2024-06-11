import { MigrationInterface, QueryRunner } from "typeorm";

export class Linkedout1718111090654 implements MigrationInterface {
    name = 'Linkedout1718111090654'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "essay" DROP CONSTRAINT "FK_d250ec275bcd3066f7559dfc63c"`);
        await queryRunner.query(`DROP INDEX "public"."essay_title_content_trgm_idx"`);
        await queryRunner.query(`DROP INDEX "public"."essay_title_trgm_idx"`);
        await queryRunner.query(`DROP INDEX "public"."essay_content_trgm_idx"`);
        await queryRunner.query(`ALTER TABLE "essay" ADD CONSTRAINT "FK_d250ec275bcd3066f7559dfc63c" FOREIGN KEY ("story_id") REFERENCES "story"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "essay" DROP CONSTRAINT "FK_d250ec275bcd3066f7559dfc63c"`);
        await queryRunner.query(`CREATE INDEX "essay_content_trgm_idx" ON "essay" ("content") `);
        await queryRunner.query(`CREATE INDEX "essay_title_trgm_idx" ON "essay" ("title") `);
        await queryRunner.query(`CREATE INDEX "essay_title_content_trgm_idx" ON "essay" ("title", "content") `);
        await queryRunner.query(`ALTER TABLE "essay" ADD CONSTRAINT "FK_d250ec275bcd3066f7559dfc63c" FOREIGN KEY ("story_id") REFERENCES "story"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
