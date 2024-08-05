import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateContentColumnAndFunction1722867638807 implements MigrationInterface {
  name = 'UpdateContentColumnAndFunction1722867638807';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 이미 존재하는 content 컬럼의 타입을 text로 변경
    await queryRunner.query(`ALTER TABLE "essay" ALTER COLUMN "content" TYPE text`);

    // update_unaccented_and_search_vector 함수 변경
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_unaccented_and_search_vector()
      RETURNS TRIGGER AS $$
      BEGIN
        -- HTML 태그 제거를 위한 전처리 추가
        NEW.unaccented_title := unaccent(regexp_replace(COALESCE(NEW.title, ''), '<[^>]+>', '', 'g'));
        NEW.unaccented_content := unaccent(regexp_replace(COALESCE(NEW.content, ''), '<[^>]+>', '', 'g'));
        NEW.search_vector :=
          setweight(to_tsvector('simple', NEW.unaccented_title), 'A') ||
          setweight(to_tsvector('simple', NEW.unaccented_content), 'B');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // content 컬럼을 기존 타입으로 되돌림 (여기서는 character varying으로 설정)
    await queryRunner.query(`ALTER TABLE "essay" ALTER COLUMN "content" TYPE character varying`);

    // 함수 원복
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_unaccented_and_search_vector()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.unaccented_title := unaccent(COALESCE(NEW.title, ''));
        NEW.unaccented_content := unaccent(COALESCE(NEW.content, ''));
        NEW.search_vector :=
          setweight(to_tsvector('simple', NEW.unaccented_title), 'A') ||
          setweight(to_tsvector('simple', NEW.unaccented_content), 'B');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
  }
}
