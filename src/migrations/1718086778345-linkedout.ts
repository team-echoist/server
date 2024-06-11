import { MigrationInterface, QueryRunner } from 'typeorm';

export class Linkedout1718086778345 implements MigrationInterface {
  name = 'Linkedout1718086778345';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE EXTENSION IF NOT EXISTS pg_trgm;
            CREATE INDEX IF NOT EXISTS essay_title_trgm_idx ON essay USING gin (title gin_trgm_ops);
            CREATE INDEX IF NOT EXISTS essay_content_trgm_idx ON essay USING gin (content gin_trgm_ops);
            CREATE INDEX IF NOT EXISTS essay_title_content_trgm_idx ON essay USING gin ((title || ' ' || content) gin_trgm_ops);
        `);
    await queryRunner.query(
      `ALTER TABLE "essay" ADD CONSTRAINT "FK_d250ec275bcd3066f7559dfc63c" FOREIGN KEY ("story_id") REFERENCES "story"("id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX IF EXISTS essay_title_trgm_idx;
            DROP INDEX IF EXISTS essay_content_trgm_idx;
            DROP INDEX IF EXISTS essay_title_content_trgm_idx;
        `);
    await queryRunner.query(
      `ALTER TABLE "essay" ADD CONSTRAINT "FK_d250ec275bcd3066f7559dfc63c" FOREIGN KEY ("story_id") REFERENCES "story"("id") ON DELETE CASCADE`,
    );
  }
}
