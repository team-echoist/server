import { MigrationInterface, QueryRunner } from 'typeorm';

export class Linkedout1718257068015 implements MigrationInterface {
  name = 'Linkedout1718257068015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "follow" DROP CONSTRAINT "FK_e9f68503556c5d72a161ce38513"`,
    );
    await queryRunner.query(
      `ALTER TABLE "follow" DROP CONSTRAINT "FK_550dce89df9570f251b6af2665a"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_cafff0e44516056e9dc16f7bb9"`);
    await queryRunner.query(`ALTER TABLE "bookmark" RENAME COLUMN "createdDate" TO "created_date"`);
    await queryRunner.query(`ALTER TABLE "basic_nickname" RENAME COLUMN "isUsed" TO "is_used"`);
    await queryRunner.query(`ALTER TABLE "follow" DROP COLUMN "followerId"`);
    await queryRunner.query(`ALTER TABLE "follow" DROP COLUMN "followingId"`);
    await queryRunner.query(`ALTER TABLE "follow" ADD "follower_id" integer`);
    await queryRunner.query(`ALTER TABLE "follow" ADD "following_id" integer`);
    await queryRunner.query(
      `CREATE INDEX "IDX_e7f852820b991c670cdecd4d5d" ON "basic_nickname" ("is_used") `,
    );
    await queryRunner.query(
      `ALTER TABLE "follow" ADD CONSTRAINT "FK_e65ef3268d3d5589f94b09c2373" FOREIGN KEY ("follower_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "follow" ADD CONSTRAINT "FK_7e66760f06ef2ca5eb43109d1cc" FOREIGN KEY ("following_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "follow" DROP CONSTRAINT "FK_7e66760f06ef2ca5eb43109d1cc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "follow" DROP CONSTRAINT "FK_e65ef3268d3d5589f94b09c2373"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_e7f852820b991c670cdecd4d5d"`);
    await queryRunner.query(`ALTER TABLE "follow" DROP COLUMN "following_id"`);
    await queryRunner.query(`ALTER TABLE "follow" DROP COLUMN "follower_id"`);
    await queryRunner.query(`ALTER TABLE "follow" ADD "followingId" integer`);
    await queryRunner.query(`ALTER TABLE "follow" ADD "followerId" integer`);
    await queryRunner.query(`ALTER TABLE "basic_nickname" RENAME COLUMN "is_used" TO "isUsed"`);
    await queryRunner.query(`ALTER TABLE "bookmark" RENAME COLUMN "created_date" TO "createdDate"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_cafff0e44516056e9dc16f7bb9" ON "basic_nickname" ("isUsed") `,
    );
    await queryRunner.query(
      `ALTER TABLE "follow" ADD CONSTRAINT "FK_550dce89df9570f251b6af2665a" FOREIGN KEY ("followerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "follow" ADD CONSTRAINT "FK_e9f68503556c5d72a161ce38513" FOREIGN KEY ("followingId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
