import { MigrationInterface, QueryRunner } from 'typeorm';

export class Linkedout1718143976572 implements MigrationInterface {
  name = 'Linkedout1718143976572';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 확장 설치
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS unaccent;`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

    // unaccented_title 및 unaccented_content 필드 추가
    const hasUnaccentedTitleColumn = await queryRunner.query(`
      SELECT 1
      FROM information_schema.columns 
      WHERE table_name = 'essay' 
      AND column_name = 'unaccented_title'
    `);
    if (!hasUnaccentedTitleColumn.length) {
      await queryRunner.query(`
        ALTER TABLE essay 
        ADD COLUMN unaccented_title text;
      `);
    }

    const hasUnaccentedContentColumn = await queryRunner.query(`
      SELECT 1
      FROM information_schema.columns 
      WHERE table_name = 'essay' 
      AND column_name = 'unaccented_content'
    `);
    if (!hasUnaccentedContentColumn.length) {
      await queryRunner.query(`
        ALTER TABLE essay 
        ADD COLUMN unaccented_content text;
      `);
    }

    // search_vector 필드 추가
    const hasSearchVectorColumn = await queryRunner.query(`
      SELECT 1
      FROM information_schema.columns 
      WHERE table_name = 'essay' 
      AND column_name = 'search_vector'
    `);
    if (!hasSearchVectorColumn.length) {
      await queryRunner.query(`
        ALTER TABLE essay 
        ADD COLUMN search_vector tsvector;
      `);
    }

    // 인덱스 생성
    const hasSearchVectorIndex = await queryRunner.query(`
      SELECT 1
      FROM pg_indexes 
      WHERE tablename = 'essay' 
      AND indexname = 'idx_essay_search_vector'
    `);
    if (!hasSearchVectorIndex.length) {
      await queryRunner.query(`
        CREATE INDEX idx_essay_search_vector 
        ON essay 
        USING gin(search_vector);
      `);
    }

    const hasTitleTrigramIndex = await queryRunner.query(`
      SELECT 1
      FROM pg_indexes 
      WHERE tablename = 'essay' 
      AND indexname = 'idx_essay_unaccented_title_trgm'
    `);
    if (!hasTitleTrigramIndex.length) {
      await queryRunner.query(`
        CREATE INDEX idx_essay_unaccented_title_trgm 
        ON essay 
        USING gin (unaccented_title gin_trgm_ops);
      `);
    }

    const hasContentTrigramIndex = await queryRunner.query(`
      SELECT 1
      FROM pg_indexes 
      WHERE tablename = 'essay' 
      AND indexname = 'idx_essay_unaccented_content_trgm'
    `);
    if (!hasContentTrigramIndex.length) {
      await queryRunner.query(`
        CREATE INDEX idx_essay_unaccented_content_trgm 
        ON essay 
        USING gin (unaccented_content gin_trgm_ops);
      `);
    }

    // 트리거 함수 생성
    const hasTriggerFunction = await queryRunner.query(`
      SELECT 1 
      FROM pg_proc 
      WHERE proname = 'update_unaccented_and_search_vector';
    `);
    if (!hasTriggerFunction.length) {
      await queryRunner.query(`
        CREATE OR REPLACE FUNCTION update_unaccented_and_search_vector()
        RETURNS trigger AS $$
        BEGIN
          NEW.unaccented_title := unaccent(coalesce(NEW.title, ''));
          NEW.unaccented_content := unaccent(coalesce(NEW.content, ''));
          NEW.search_vector :=
            setweight(to_tsvector('simple', NEW.unaccented_title), 'A') || 
            setweight(to_tsvector('simple', NEW.unaccented_content), 'B');
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);
    }

    // 트리거 생성
    const hasTrigger = await queryRunner.query(`
      SELECT 1 
      FROM pg_trigger 
      WHERE tgname = 'tsvector_and_unaccented_update';
    `);
    if (!hasTrigger.length) {
      await queryRunner.query(`
        CREATE TRIGGER tsvector_and_unaccented_update 
        BEFORE INSERT OR UPDATE ON essay 
        FOR EACH ROW EXECUTE FUNCTION update_unaccented_and_search_vector();
      `);
    }

    // 기존 데이터의 search_vector 및 unaccented 컬럼 업데이트
    await queryRunner.query(`
      UPDATE essay SET 
        unaccented_title = unaccent(coalesce(title, '')),
        unaccented_content = unaccent(coalesce(content, '')),
        search_vector = 
          setweight(to_tsvector('simple', unaccent(coalesce(title, ''))), 'A') || 
          setweight(to_tsvector('simple', unaccent(coalesce(content, ''))), 'B');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 트리거 제거
    await queryRunner.query(`DROP TRIGGER IF EXISTS tsvector_and_unaccented_update ON essay;`);

    // 트리거 함수 제거
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_unaccented_and_search_vector;`);

    // 인덱스 제거
    await queryRunner.query(`DROP INDEX IF EXISTS idx_essay_search_vector;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_essay_unaccented_title_trgm;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_essay_unaccented_content_trgm;`);

    // search_vector 및 unaccented 컬럼 제거
    await queryRunner.query(`ALTER TABLE essay DROP COLUMN IF EXISTS search_vector;`);
    await queryRunner.query(`ALTER TABLE essay DROP COLUMN IF EXISTS unaccented_title;`);
    await queryRunner.query(`ALTER TABLE essay DROP COLUMN IF EXISTS unaccented_content;`);
  }
}
