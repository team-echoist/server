import { HttpException, HttpStatus } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { Transactional } from 'typeorm-transactional';

import { ChangeThemeCommand } from '../changeTheme.command';
import { BaseCommandHandler } from './base/baseCommand.handler';

@CommandHandler(ChangeThemeCommand)
export class ChangeThemeHandler extends BaseCommandHandler<ChangeThemeCommand> {
  @Transactional()
  async execute(command: ChangeThemeCommand) {
    const { userId, themeId } = command;

    const userThemes = await this.homeService.getUserThemes(userId);
    const ownsTheme = userThemes.some((theme) => theme.id === themeId);
    if (!ownsTheme)
      throw new HttpException('해당 테마를 소유하고 있지 않습니다.', HttpStatus.BAD_REQUEST);

    const currentLayout = await this.homeService.getActiveLayout(userId);
    if (currentLayout) await this.homeService.deactivateLayout(currentLayout);

    const newLayout = await this.homeService.getLayoutByTheme(userId, themeId);
    if (!newLayout)
      throw new HttpException(
        '해당 테마에 대한 레이아웃이 존재하지 않습니다.',
        HttpStatus.NOT_FOUND,
      );

    await this.homeService.activateLayout(newLayout);

    await this.homeService.clearUserCache(userId);
  }
}
