import { MigrationInterface, QueryRunner } from 'typeorm';

export class AppVersionsEntity1722998847040 implements MigrationInterface {
  name = 'AppVersionsEntity1722998847040';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."app_versions_app_type_enum" AS ENUM('android_mobile', 'android_tablet', 'ios_mobile', 'ios_tablet', 'desktop_mac', 'desktop_windows')`,
    );
    await queryRunner.query(
      `CREATE TABLE "app_versions" ("id" SERIAL NOT NULL, "app_type" "public"."app_versions_app_type_enum" NOT NULL, "version" character varying NOT NULL DEFAULT '0.0.0', "release_date" TIMESTAMP WITH TIME ZONE NOT NULL, "created_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_8d36b0dcf0c026c7aad923c80fd" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "app_versions"`);
    await queryRunner.query(`DROP TYPE "public"."app_versions_app_type_enum"`);
  }
}
