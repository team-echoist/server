import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUser1719755385822 implements MigrationInterface {
  name = 'UpdateUser1719755385822';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" DROP CONSTRAINT "FK_9eb58b0b777dbc2864820228ebc"`,
    );
    await queryRunner.query(`ALTER TABLE "device" RENAME COLUMN "userId" TO "user_id"`);
    await queryRunner.query(
      `ALTER TABLE "device" ADD CONSTRAINT "FK_ae7154510495c7ddda951b07a07" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" DROP CONSTRAINT "FK_ae7154510495c7ddda951b07a07"`,
    );
    await queryRunner.query(`ALTER TABLE "device" RENAME COLUMN "user_id" TO "userId"`);
    await queryRunner.query(
      `ALTER TABLE "device" ADD CONSTRAINT "FK_9eb58b0b777dbc2864820228ebc" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
