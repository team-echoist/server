import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdatedefaultProfileImage1723272007648 implements MigrationInterface {
  name = 'UpdatedefaultProfileImage1723272007648';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "profile_image" SET DEFAULT 'https://cdn.linkedoutapp.com/service/profile_icon_01.png'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "profile_image" SET DEFAULT 'https://driqat77mj5du.cloudfront.net/service/profile_icon_01.png'`,
    );
  }
}
