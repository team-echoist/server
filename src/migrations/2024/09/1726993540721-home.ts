import { MigrationInterface, QueryRunner } from 'typeorm';

export class Home1726993540721 implements MigrationInterface {
  name = 'Home1726993540721';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "theme" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "price" integer NOT NULL, "url" character varying, CONSTRAINT "PK_c1934d0b4403bf10c1ab0c18166" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_home_layout" ("id" SERIAL NOT NULL, "updated_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" integer, "theme_id" integer, CONSTRAINT "PK_96193be923cb2320a7b8fb71b58" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_home_item" ("id" SERIAL NOT NULL, "user_home_layout_id" integer, "item_id" integer, CONSTRAINT "PK_73d2c462bb282089314c9b792e4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "item" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "position" character varying NOT NULL, "price" integer NOT NULL, "url" character varying, CONSTRAINT "PK_d3c0c71f23e7adcf952a1d13423" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_item" ("id" SERIAL NOT NULL, "purchased_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" integer, "item_id" integer, CONSTRAINT "PK_6f15f417e5d2ea53723fa47158a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_theme" ("id" SERIAL NOT NULL, "purchased_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" integer, "theme_id" integer, CONSTRAINT "PK_af23da24d972d165b03e7d79550" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_home_layout" ADD CONSTRAINT "FK_b7943fb4628e042447b6b57bcf0" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_home_layout" ADD CONSTRAINT "FK_d31b9925405e60bb4a1109286ba" FOREIGN KEY ("theme_id") REFERENCES "theme"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_home_item" ADD CONSTRAINT "FK_0b4aa9efec7167573e82c3d91ab" FOREIGN KEY ("user_home_layout_id") REFERENCES "user_home_layout"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_home_item" ADD CONSTRAINT "FK_5f8da352efba89b9544a291fa3b" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_item" ADD CONSTRAINT "FK_86dffd41936c53d132586941722" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_item" ADD CONSTRAINT "FK_b9f93f5027bfcb8386c758f8124" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_theme" ADD CONSTRAINT "FK_d5b7f011df6497cfb661523a182" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_theme" ADD CONSTRAINT "FK_6bcb73329dc39e831d54cfd2d80" FOREIGN KEY ("theme_id") REFERENCES "theme"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_theme" DROP CONSTRAINT "FK_6bcb73329dc39e831d54cfd2d80"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_theme" DROP CONSTRAINT "FK_d5b7f011df6497cfb661523a182"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_item" DROP CONSTRAINT "FK_b9f93f5027bfcb8386c758f8124"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_item" DROP CONSTRAINT "FK_86dffd41936c53d132586941722"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_home_item" DROP CONSTRAINT "FK_5f8da352efba89b9544a291fa3b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_home_item" DROP CONSTRAINT "FK_0b4aa9efec7167573e82c3d91ab"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_home_layout" DROP CONSTRAINT "FK_d31b9925405e60bb4a1109286ba"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_home_layout" DROP CONSTRAINT "FK_b7943fb4628e042447b6b57bcf0"`,
    );
    await queryRunner.query(`DROP TABLE "user_theme"`);
    await queryRunner.query(`DROP TABLE "user_item"`);
    await queryRunner.query(`DROP TABLE "item"`);
    await queryRunner.query(`DROP TABLE "user_home_item"`);
    await queryRunner.query(`DROP TABLE "user_home_layout"`);
    await queryRunner.query(`DROP TABLE "theme"`);
  }
}
