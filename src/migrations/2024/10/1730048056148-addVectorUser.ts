import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVectorUser1730048056148 implements MigrationInterface {
  name = 'AddVectorUser1730048056148';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS unaccent`);

    // Add search_vector column for full-text search on email
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "search_vector" TSVECTOR GENERATED ALWAYS AS (to_tsvector('simple', coalesce(email, ''))) STORED`,
    );

    // Check and create index if not exists
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'IDX_USER_SEARCH_VECTOR') THEN
          CREATE INDEX "IDX_USER_SEARCH_VECTOR" ON "user" USING gin (search_vector);
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_USER_SEARCH_VECTOR"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "search_vector"`);
  }
}
