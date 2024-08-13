import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUserForegin1723484071649 implements MigrationInterface {
  name = 'UpdateUserForegin1723484071649';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "seen_notice" DROP CONSTRAINT "FK_c499d4d8e7051529e91176f8cd8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notice" DROP CONSTRAINT "FK_93b424b0607d9ae07626f280f6b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "updated_history" DROP CONSTRAINT "FK_a32790492a759b5b799efb9ce60"`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" DROP CONSTRAINT "FK_294fefbfa09f2f019431f48a636"`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" DROP CONSTRAINT "FK_2e29c87893e98a3464046937e13"`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" DROP CONSTRAINT "FK_ea3c11d6375dab4b05c6e3edb4b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" DROP CONSTRAINT "FK_3dd814d9347e63e554957b235c6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" DROP CONSTRAINT "FK_6521bddfe8435d4d84114ac0820"`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" DROP CONSTRAINT "FK_3e6c559ddc3e27aef5dd4182ca1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" DROP CONSTRAINT "FK_8e7c9b9dd653ecb6c47b7b2fbb1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "report_queue" DROP CONSTRAINT "FK_17f5a71e6174c1d74369d60bfc4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tag_exp" DROP CONSTRAINT "FK_0c0fb03b1b54bde8ef896260377"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tag_exp" DROP CONSTRAINT "FK_5364981bb8cf5790cd4468bf94b"`,
    );
    await queryRunner.query(`ALTER TABLE "essay" DROP CONSTRAINT "FK_d250ec275bcd3066f7559dfc63c"`);
    await queryRunner.query(
      `ALTER TABLE "essay_tags" DROP CONSTRAINT "FK_548b10d1df4710a4412359d93da"`,
    );
    await queryRunner.query(
      `ALTER TABLE "seen_notice" ADD CONSTRAINT "FK_c499d4d8e7051529e91176f8cd8" FOREIGN KEY ("notice_id") REFERENCES "notice"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notice" ADD CONSTRAINT "FK_93b424b0607d9ae07626f280f6b" FOREIGN KEY ("admin_id") REFERENCES "admin"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "updated_history" ADD CONSTRAINT "FK_a32790492a759b5b799efb9ce60" FOREIGN KEY ("admin_id") REFERENCES "admin"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" ADD CONSTRAINT "FK_8e7c9b9dd653ecb6c47b7b2fbb1" FOREIGN KEY ("admin_id") REFERENCES "admin"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" ADD CONSTRAINT "FK_3e6c559ddc3e27aef5dd4182ca1" FOREIGN KEY ("report_id") REFERENCES "report_queue"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" ADD CONSTRAINT "FK_6521bddfe8435d4d84114ac0820" FOREIGN KEY ("review_id") REFERENCES "review_queue"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" ADD CONSTRAINT "FK_3dd814d9347e63e554957b235c6" FOREIGN KEY ("essay_id") REFERENCES "essay"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" ADD CONSTRAINT "FK_ea3c11d6375dab4b05c6e3edb4b" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" ADD CONSTRAINT "FK_2e29c87893e98a3464046937e13" FOREIGN KEY ("inquiry_id") REFERENCES "inquiry"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" ADD CONSTRAINT "FK_294fefbfa09f2f019431f48a636" FOREIGN KEY ("notice_id") REFERENCES "notice"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "report_queue" ADD CONSTRAINT "FK_17f5a71e6174c1d74369d60bfc4" FOREIGN KEY ("essay_id") REFERENCES "essay"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tag_exp" ADD CONSTRAINT "FK_5364981bb8cf5790cd4468bf94b" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tag_exp" ADD CONSTRAINT "FK_0c0fb03b1b54bde8ef896260377" FOREIGN KEY ("badge") REFERENCES "badge"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "essay" ADD CONSTRAINT "FK_d250ec275bcd3066f7559dfc63c" FOREIGN KEY ("story_id") REFERENCES "story"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "essay_tags" ADD CONSTRAINT "FK_548b10d1df4710a4412359d93da" FOREIGN KEY ("tagId") REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "essay_tags" DROP CONSTRAINT "FK_548b10d1df4710a4412359d93da"`,
    );
    await queryRunner.query(`ALTER TABLE "essay" DROP CONSTRAINT "FK_d250ec275bcd3066f7559dfc63c"`);
    await queryRunner.query(
      `ALTER TABLE "tag_exp" DROP CONSTRAINT "FK_0c0fb03b1b54bde8ef896260377"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tag_exp" DROP CONSTRAINT "FK_5364981bb8cf5790cd4468bf94b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "report_queue" DROP CONSTRAINT "FK_17f5a71e6174c1d74369d60bfc4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" DROP CONSTRAINT "FK_294fefbfa09f2f019431f48a636"`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" DROP CONSTRAINT "FK_2e29c87893e98a3464046937e13"`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" DROP CONSTRAINT "FK_ea3c11d6375dab4b05c6e3edb4b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" DROP CONSTRAINT "FK_3dd814d9347e63e554957b235c6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" DROP CONSTRAINT "FK_6521bddfe8435d4d84114ac0820"`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" DROP CONSTRAINT "FK_3e6c559ddc3e27aef5dd4182ca1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" DROP CONSTRAINT "FK_8e7c9b9dd653ecb6c47b7b2fbb1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "updated_history" DROP CONSTRAINT "FK_a32790492a759b5b799efb9ce60"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notice" DROP CONSTRAINT "FK_93b424b0607d9ae07626f280f6b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "seen_notice" DROP CONSTRAINT "FK_c499d4d8e7051529e91176f8cd8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "essay_tags" ADD CONSTRAINT "FK_548b10d1df4710a4412359d93da" FOREIGN KEY ("tagId") REFERENCES "tag"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "essay" ADD CONSTRAINT "FK_d250ec275bcd3066f7559dfc63c" FOREIGN KEY ("story_id") REFERENCES "story"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tag_exp" ADD CONSTRAINT "FK_5364981bb8cf5790cd4468bf94b" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tag_exp" ADD CONSTRAINT "FK_0c0fb03b1b54bde8ef896260377" FOREIGN KEY ("badge") REFERENCES "badge"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "report_queue" ADD CONSTRAINT "FK_17f5a71e6174c1d74369d60bfc4" FOREIGN KEY ("essay_id") REFERENCES "essay"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" ADD CONSTRAINT "FK_8e7c9b9dd653ecb6c47b7b2fbb1" FOREIGN KEY ("admin_id") REFERENCES "admin"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" ADD CONSTRAINT "FK_3e6c559ddc3e27aef5dd4182ca1" FOREIGN KEY ("report_id") REFERENCES "report_queue"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" ADD CONSTRAINT "FK_6521bddfe8435d4d84114ac0820" FOREIGN KEY ("review_id") REFERENCES "review_queue"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" ADD CONSTRAINT "FK_3dd814d9347e63e554957b235c6" FOREIGN KEY ("essay_id") REFERENCES "essay"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" ADD CONSTRAINT "FK_ea3c11d6375dab4b05c6e3edb4b" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" ADD CONSTRAINT "FK_2e29c87893e98a3464046937e13" FOREIGN KEY ("inquiry_id") REFERENCES "inquiry"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "processed_history" ADD CONSTRAINT "FK_294fefbfa09f2f019431f48a636" FOREIGN KEY ("notice_id") REFERENCES "notice"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "updated_history" ADD CONSTRAINT "FK_a32790492a759b5b799efb9ce60" FOREIGN KEY ("admin_id") REFERENCES "admin"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notice" ADD CONSTRAINT "FK_93b424b0607d9ae07626f280f6b" FOREIGN KEY ("admin_id") REFERENCES "admin"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "seen_notice" ADD CONSTRAINT "FK_c499d4d8e7051529e91176f8cd8" FOREIGN KEY ("notice_id") REFERENCES "notice"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
