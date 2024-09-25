import { MigrationInterface, QueryRunner } from 'typeorm';

export class Cascade1727152576672 implements MigrationInterface {
  name = 'Cascade1727152576672';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_home_layout" DROP CONSTRAINT "FK_d31b9925405e60bb4a1109286ba"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_home_layout" DROP CONSTRAINT "FK_b7943fb4628e042447b6b57bcf0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_home_item" DROP CONSTRAINT "FK_5f8da352efba89b9544a291fa3b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_home_item" DROP CONSTRAINT "FK_0b4aa9efec7167573e82c3d91ab"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_item" DROP CONSTRAINT "FK_b9f93f5027bfcb8386c758f8124"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_item" DROP CONSTRAINT "FK_86dffd41936c53d132586941722"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_theme" DROP CONSTRAINT "FK_6bcb73329dc39e831d54cfd2d80"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_theme" DROP CONSTRAINT "FK_d5b7f011df6497cfb661523a182"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_home_layout" ADD CONSTRAINT "FK_b7943fb4628e042447b6b57bcf0" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_home_layout" ADD CONSTRAINT "FK_d31b9925405e60bb4a1109286ba" FOREIGN KEY ("theme_id") REFERENCES "theme"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_home_item" ADD CONSTRAINT "FK_0b4aa9efec7167573e82c3d91ab" FOREIGN KEY ("user_home_layout_id") REFERENCES "user_home_layout"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_home_item" ADD CONSTRAINT "FK_5f8da352efba89b9544a291fa3b" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_item" ADD CONSTRAINT "FK_86dffd41936c53d132586941722" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_item" ADD CONSTRAINT "FK_b9f93f5027bfcb8386c758f8124" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_theme" ADD CONSTRAINT "FK_d5b7f011df6497cfb661523a182" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_theme" ADD CONSTRAINT "FK_6bcb73329dc39e831d54cfd2d80" FOREIGN KEY ("theme_id") REFERENCES "theme"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
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
    await queryRunner.query(
      `ALTER TABLE "user_theme" ADD CONSTRAINT "FK_d5b7f011df6497cfb661523a182" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_theme" ADD CONSTRAINT "FK_6bcb73329dc39e831d54cfd2d80" FOREIGN KEY ("theme_id") REFERENCES "theme"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_item" ADD CONSTRAINT "FK_86dffd41936c53d132586941722" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_item" ADD CONSTRAINT "FK_b9f93f5027bfcb8386c758f8124" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_home_item" ADD CONSTRAINT "FK_0b4aa9efec7167573e82c3d91ab" FOREIGN KEY ("user_home_layout_id") REFERENCES "user_home_layout"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_home_item" ADD CONSTRAINT "FK_5f8da352efba89b9544a291fa3b" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_home_layout" ADD CONSTRAINT "FK_b7943fb4628e042447b6b57bcf0" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_home_layout" ADD CONSTRAINT "FK_d31b9925405e60bb4a1109286ba" FOREIGN KEY ("theme_id") REFERENCES "theme"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
