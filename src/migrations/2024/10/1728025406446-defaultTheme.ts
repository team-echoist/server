import { MigrationInterface, QueryRunner } from 'typeorm';

export class DefaultTheme1728025406446 implements MigrationInterface {
  name = 'DefaultTheme1728025406446';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 모든 유저 가져오기
    const users = await queryRunner.query(`SELECT id FROM "user"`);

    // 기본 테마 가져오기
    const defaultTheme = await queryRunner.query(`SELECT id FROM theme WHERE id = 1`);

    if (!defaultTheme || defaultTheme.length === 0) {
      throw new Error('기본 테마가 존재하지 않습니다.');
    }

    const themeId = defaultTheme[0].id; // 배열의 첫 번째 요소에서 id 추출

    for (const user of users) {
      // 이미 테마가 존재하는지 확인
      const existingUserTheme = await queryRunner.query(
        `SELECT * FROM user_theme WHERE user_id = $1 AND theme_id = $2`,
        [user.id, themeId], // 수정된 부분
      );

      if (existingUserTheme.length === 0) {
        // 새로운 UserTheme 생성
        await queryRunner.query(
          `INSERT INTO user_theme (user_id, theme_id, purchased_date) VALUES ($1, $2, $3)`,
          [user.id, themeId, new Date()], // 수정된 부분
        );
      }

      // 이미 레이아웃이 존재하는지 확인
      const existingUserLayout = await queryRunner.query(
        `SELECT * FROM user_home_layout WHERE user_id = $1 AND theme_id = $2`,
        [user.id, themeId], // 수정된 부분
      );

      if (existingUserLayout.length === 0) {
        // 새로운 UserHomeLayout 생성
        await queryRunner.query(
          `INSERT INTO user_home_layout (user_id, theme_id, is_active) VALUES ($1, $2, $3)`,
          [user.id, themeId, true], // 수정된 부분
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const defaultTheme = await queryRunner.query(`SELECT id FROM theme WHERE id = 1`);

    if (defaultTheme && defaultTheme.length > 0) {
      const themeId = defaultTheme[0].id;
      await queryRunner.query(`DELETE FROM user_theme WHERE theme_id = $1`, [themeId]);
      await queryRunner.query(`DELETE FROM user_home_layout WHERE theme_id = $1`, [themeId]);
    }
  }
}
