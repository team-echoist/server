import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOnDeleteSetNullToDeviceRelations1723005232154 implements MigrationInterface {
  name = 'AddOnDeleteSetNullToDeviceRelations1723005232154';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "essay" DROP CONSTRAINT "FK_6bc8a83cf679bba24c15af891b5"`);
    await queryRunner.query(
      `ALTER TABLE "essay" ADD CONSTRAINT "FK_6bc8a83cf679bba24c15af891b5" FOREIGN KEY ("deviceId") REFERENCES "device"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "essay" DROP CONSTRAINT "FK_6bc8a83cf679bba24c15af891b5"`);
    await queryRunner.query(
      `ALTER TABLE "essay" ADD CONSTRAINT "FK_6bc8a83cf679bba24c15af891b5" FOREIGN KEY ("deviceId") REFERENCES "device"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
