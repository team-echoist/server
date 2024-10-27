import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTrigramUser1730047331380 implements MigrationInterface {
  name = 'AddTrigramUser1730047331380';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS unaccent`);

    // Add unaccented_email column (no generated expression)
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "unaccented_email" TEXT`);

    // Populate unaccented_email initially
    await queryRunner.query(`UPDATE "user" SET "unaccented_email" = unaccent(email)`);

    // Create trigger function for unaccented_email updates
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_unaccented_email()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.unaccented_email = unaccent(NEW.email);
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Apply trigger to update unaccented_email on email change
    await queryRunner.query(`
      CREATE TRIGGER trigger_update_unaccented_email
      BEFORE INSERT OR UPDATE OF email ON "user"
      FOR EACH ROW EXECUTE FUNCTION update_unaccented_email();
    `);

    // Create index for trigram search on unaccented_email
    await queryRunner.query(
      `CREATE INDEX "IDX_USER_UNACCENTED_EMAIL" ON "user" USING gin (unaccented_email gin_trgm_ops)`,
    );

    // Optional: Create index for text search if required
    await queryRunner.query(
      `CREATE INDEX "IDX_USER_SEARCH_VECTOR" ON "user" USING gin (to_tsvector('simple', coalesce(email, '')))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_USER_SEARCH_VECTOR"`);
    await queryRunner.query(`DROP INDEX "IDX_USER_UNACCENTED_EMAIL"`);
    await queryRunner.query(`DROP TRIGGER trigger_update_unaccented_email ON "user"`);
    await queryRunner.query(`DROP FUNCTION update_unaccented_email`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "unaccented_email"`);
  }
}
