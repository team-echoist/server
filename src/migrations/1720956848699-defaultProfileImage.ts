import { MigrationInterface, QueryRunner } from 'typeorm';

export class DefaultProfileImage1720956848699 implements MigrationInterface {
  name = 'DefaultProfileImage1720956848699';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "profile_image" SET DEFAULT 'https://driqat77mj5du.cloudfront.net/service/profile_icon_01.png'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "profile_image" DROP DEFAULT`);
  }
}
