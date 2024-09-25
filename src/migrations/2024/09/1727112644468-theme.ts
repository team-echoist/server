import { MigrationInterface, QueryRunner } from 'typeorm';

export class Theme1727112644468 implements MigrationInterface {
  name = 'Theme1727112644468';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 기본 테마 생성
    await queryRunner.query(`
      INSERT INTO theme (name, price, url)
      VALUES ('Workaholic', 0, 'https://cdn.linkedoutapp.com/home/theme1.png')
      RETURNING id
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM theme WHERE name = 'Workaholic'
    `);
  }
}
