import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemovalOfNotificationSettingsAndUniqueRestrictions1722090662715
  implements MigrationInterface
{
  name = 'RemovalOfNotificationSettingsAndUniqueRestrictions1722090662715';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "alert_settings" DROP CONSTRAINT "UQ_793aefbc2b5fa2ae79f54720e53"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "alert_settings" ADD CONSTRAINT "UQ_793aefbc2b5fa2ae79f54720e53" UNIQUE ("device_id")`,
    );
  }
}
