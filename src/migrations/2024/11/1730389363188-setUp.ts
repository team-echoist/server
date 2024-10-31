import { MigrationInterface, QueryRunner } from 'typeorm';

export class SetUp1730389363188 implements MigrationInterface {
  name = 'SetUp1730389363188';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 필요한 확장 설치
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS unaccent;`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);

    // 2. 에세이 테이블 인덱스 추가
    await queryRunner.query(`
      CREATE INDEX "idx_essay_unaccented_content_trgm" ON "essay" USING GIN ("unaccented_content" gin_trgm_ops);
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_essay_unaccented_title_trgm" ON "essay" USING GIN ("unaccented_title" gin_trgm_ops);
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_essay_search_vector" ON "essay" USING GIN ("search_vector");
    `);
    await queryRunner.query(`
      CREATE INDEX "essay_content_trgm_idx" ON "essay" USING GIN ("content" gin_trgm_ops);
    `);
    await queryRunner.query(`
      CREATE INDEX "essay_title_trgm_idx" ON "essay" USING GIN ("title" gin_trgm_ops);
    `);

    // 3. 에세이 테이블의 트리거 함수 생성 및 트리거 등록
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_unaccented_and_search_vector()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.unaccented_title := unaccent(regexp_replace(COALESCE(NEW.title, ''), '<[^>]+>', '', 'g'));
        NEW.unaccented_content := unaccent(regexp_replace(COALESCE(NEW.content, ''), '<[^>]+>', '', 'g'));
        NEW.search_vector :=
          setweight(to_tsvector('simple', NEW.unaccented_title), 'A') ||
          setweight(to_tsvector('simple', NEW.unaccented_content), 'B');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS tsvector_and_unaccented_update ON essay;
      CREATE TRIGGER tsvector_and_unaccented_update
      BEFORE INSERT OR UPDATE ON essay
      FOR EACH ROW EXECUTE FUNCTION update_unaccented_and_search_vector();
    `);

    // 4. 에세이 테이블의 기존 레코드에 대한 업데이트 실행
    await queryRunner.query(`
      UPDATE essay SET
        unaccented_title = unaccent(COALESCE(title, '')),
        unaccented_content = unaccent(COALESCE(content, '')),
        search_vector =
          setweight(to_tsvector('simple', unaccent(COALESCE(title, ''))), 'A') ||
          setweight(to_tsvector('simple', unaccent(COALESCE(content, ''))), 'B')
      WHERE unaccented_title IS NULL OR unaccented_content IS NULL;
    `);

    // 5. 사용자 이메일 필드를 위한 트리거 함수 및 트리거 등록
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_unaccented_email()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.unaccented_email = unaccent(NEW.email);
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    await queryRunner.query(`
      CREATE TRIGGER trigger_update_unaccented_email
      BEFORE INSERT OR UPDATE OF email ON "user"
      FOR EACH ROW EXECUTE FUNCTION update_unaccented_email();
    `);

    // 6. 사용자 테이블 인덱스 추가
    await queryRunner.query(`
      CREATE INDEX "IDX_USER_UNACCENTED_EMAIL" ON "user" USING gin (unaccented_email gin_trgm_ops);
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_USER_SEARCH_VECTOR" ON "user" USING gin (to_tsvector('simple', coalesce(email, '')));
    `);

    // 7. 인덱스 중복 방지를 위한 조건문 실행
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'IDX_USER_SEARCH_VECTOR') THEN
          CREATE INDEX "IDX_USER_SEARCH_VECTOR" ON "user" USING gin (search_vector);
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_USER_SEARCH_VECTOR";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_USER_UNACCENTED_EMAIL";`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS trigger_update_unaccented_email ON "user";`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_unaccented_email;`);

    await queryRunner.query(`DROP INDEX IF EXISTS "essay_title_trgm_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "essay_content_trgm_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_essay_search_vector";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_essay_unaccented_title_trgm";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_essay_unaccented_content_trgm";`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS tsvector_and_unaccented_update ON essay;`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_unaccented_and_search_vector;`);

    await queryRunner.query(`DROP EXTENSION IF EXISTS unaccent;`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS pg_trgm;`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS postgis;`);
  }
}
