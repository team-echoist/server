import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateServerStatus1722871194052 implements MigrationInterface {
  name = 'CreateServerStatus1722871194052';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 서버 상태 ENUM 타입이 존재하는지 확인하고, 존재하지 않을 경우 생성
    await queryRunner.query(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'server_status_enum') THEN
              CREATE TYPE "public"."server_status_enum" AS ENUM('open', 'maintenance', 'closed');
          END IF;
      END $$;
    `);

    // 서버 테이블이 존재하는지 확인하고, 존재하지 않을 경우 생성
    const tableExists = await queryRunner.hasTable('server');
    if (!tableExists) {
      await queryRunner.query(`
        CREATE TABLE "server" (
          "id" SERIAL NOT NULL, 
          "status" "public"."server_status_enum" NOT NULL DEFAULT 'open', 
          "updated_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
          CONSTRAINT "PK_f8b8af38bdc23b447c0a57c7937" PRIMARY KEY ("id")
        )
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "server"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."server_status_enum"`);
  }
}
