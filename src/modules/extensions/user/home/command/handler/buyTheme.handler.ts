import { HttpException, HttpStatus } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { Transactional } from 'typeorm-transactional';

import { BuyThemeCommand } from '../buyTheme.command';
import { BaseCommandHandler } from './base/baseCommand.handler';

@CommandHandler(BuyThemeCommand)
export class BuyThemeHandler extends BaseCommandHandler<BuyThemeCommand> {
  @Transactional()
  async execute(command: BuyThemeCommand): Promise<void> {
    const { userId, themeId } = command;

    const lockKey = `buyThemeLock:${userId}`;
    const ttl = 10000;

    const lock = await this.redisService.acquireLock(lockKey, ttl);

    // useScopeExit로 lock 해제 예약
    const releaseLock = this.toolService.useScopeExit(() => this.redisService.releaseLock(lock));

    const user = await this.userService.fetchUserEntityById(userId);
    const themePrice = await this.homeService.getThemePrice(themeId);

    if (user.gems < themePrice) {
      throw new HttpException('재화가 부족합니다.', HttpStatus.BAD_REQUEST);
    }

    user.gems -= themePrice;

    await this.homeService.addThemeToUser(user, themeId);
    await this.userService.updateUser(user.id, user);

    await this.homeService.clearUserCache(userId);

    releaseLock();
  }
}
