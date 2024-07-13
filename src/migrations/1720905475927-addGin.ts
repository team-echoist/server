import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGin1720905475927 implements MigrationInterface {
  name = 'AddGin1720905475927';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_essay_unaccented_content_trgm"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_essay_unaccented_title_trgm"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_essay_search_vector"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."essay_content_trgm_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."essay_title_trgm_idx"`);

    await queryRunner.query(
      `CREATE INDEX "idx_essay_unaccented_content_trgm" ON "essay" USING GIN ("unaccented_content" gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_essay_unaccented_title_trgm" ON "essay" USING GIN ("unaccented_title" gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_essay_search_vector" ON "essay" USING GIN ("search_vector")`,
    );
    await queryRunner.query(
      `CREATE INDEX "essay_content_trgm_idx" ON "essay" USING GIN ("content" gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX "essay_title_trgm_idx" ON "essay" USING GIN ("title" gin_trgm_ops)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_essay_unaccented_content_trgm"`);
    await queryRunner.query(`DROP INDEX "public"."idx_essay_unaccented_title_trgm"`);
    await queryRunner.query(`DROP INDEX "public"."idx_essay_search_vector"`);
    await queryRunner.query(`DROP INDEX "public"."essay_content_trgm_idx"`);
    await queryRunner.query(`DROP INDEX "public"."essay_title_trgm_idx"`);
  }
}
