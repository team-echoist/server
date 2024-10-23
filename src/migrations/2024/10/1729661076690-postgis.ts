import { MigrationInterface, QueryRunner } from 'typeorm';

export class Postgis1729661076690 implements MigrationInterface {
  name = 'Postgis1729661076690';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."review_queue_type_enum" RENAME TO "review_queue_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."review_queue_type_enum" AS ENUM('linkedout', 'published', 'buried')`,
    );
    await queryRunner.query(
      `ALTER TABLE "review_queue" ALTER COLUMN "type" TYPE "public"."review_queue_type_enum" USING "type"::"text"::"public"."review_queue_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."review_queue_type_enum_old"`);
    await queryRunner.query(
      `ALTER TYPE "public"."essay_status_enum" RENAME TO "essay_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."essay_status_enum" AS ENUM('private', 'published', 'linkedout', 'buried')`,
    );
    await queryRunner.query(`ALTER TABLE "essay" ALTER COLUMN "status" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "essay" ALTER COLUMN "status" TYPE "public"."essay_status_enum" USING "status"::"text"::"public"."essay_status_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "essay" ALTER COLUMN "status" SET DEFAULT 'private'`);
    await queryRunner.query(`DROP TYPE "public"."essay_status_enum_old"`);

    // 1. PostGIS 확장 설치
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS postgis;
    `);

    // 2. Essay 테이블에 coordinates 컬럼 추가 (geometry 타입)
    await queryRunner.query(`
      ALTER TABLE "essay" 
      ADD COLUMN "coordinates" geometry(Point, 4326);
    `);

    // 3. 기존 latitude와 longitude 데이터를 coordinates로 옮기기
    await queryRunner.query(`
      UPDATE "essay"
      SET coordinates = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
    `);

    // 4. latitude와 longitude 컬럼을 제거 (필요 없을 시)
    await queryRunner.query(`
      ALTER TABLE "essay" DROP COLUMN "latitude";
      ALTER TABLE "essay" DROP COLUMN "longitude";
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. latitude와 longitude 컬럼 복원
    await queryRunner.query(`
      ALTER TABLE "essay" ADD COLUMN "latitude" decimal(10, 7);
      ALTER TABLE "essay" ADD COLUMN "longitude" decimal(10, 7);
    `);

    // 2. coordinates 컬럼에 있는 값을 latitude, longitude로 분리
    await queryRunner.query(`
			UPDATE "essay"
			SET latitude = ST_Y(coordinates), longitude = ST_X(coordinates);
		`);

    // 3. coordinates 컬럼 제거
    await queryRunner.query(`
			ALTER TABLE "essay" DROP COLUMN "coordinates";
		`);

    // 4. PostGIS 확장 제거 (확장 제거는 필요 없을 시 생략 가능)
    await queryRunner.query(`
      DROP EXTENSION IF EXISTS postgis;
    `);

    await queryRunner.query(
      `CREATE TYPE "public"."essay_status_enum_old" AS ENUM('private', 'published', 'linkedout')`,
    );
    await queryRunner.query(`ALTER TABLE "essay" ALTER COLUMN "status" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "essay" ALTER COLUMN "status" TYPE "public"."essay_status_enum_old" USING "status"::"text"::"public"."essay_status_enum_old"`,
    );
    await queryRunner.query(`ALTER TABLE "essay" ALTER COLUMN "status" SET DEFAULT 'private'`);
    await queryRunner.query(`DROP TYPE "public"."essay_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."essay_status_enum_old" RENAME TO "essay_status_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."review_queue_type_enum_old" AS ENUM('linkedout', 'published')`,
    );
    await queryRunner.query(
      `ALTER TABLE "review_queue" ALTER COLUMN "type" TYPE "public"."review_queue_type_enum_old" USING "type"::"text"::"public"."review_queue_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."review_queue_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."review_queue_type_enum_old" RENAME TO "review_queue_type_enum"`,
    );
  }
}
