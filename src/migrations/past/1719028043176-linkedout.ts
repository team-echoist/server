import { MigrationInterface, QueryRunner } from 'typeorm';

export class Linkedout1719028043176 implements MigrationInterface {
  name = 'Linkedout1719028043176';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "processed_history" DROP CONSTRAINT "FK_6521bddfe8435d4d84114ac0820"`,
    );

    await queryRunner.query(
      `ALTER TABLE "processed_history" ADD CONSTRAINT "FK_6521bddfe8435d4d84114ac0820" FOREIGN KEY ("review_id") REFERENCES "review_queue"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "processed_history" DROP CONSTRAINT "FK_6521bddfe8435d4d84114ac0820"`,
    );

    await queryRunner.query(
      `ALTER TABLE "processed_history" ADD CONSTRAINT "FK_6521bddfe8435d4d84114ac0820" FOREIGN KEY ("review_id") REFERENCES "reviewQueue"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
