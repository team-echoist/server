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

    // todo useScopeExit의 현재 구현은 반환된 함수가 명시적으로 호출될 때만 정리를 실행합니다. releaseLock()이 호출되기 전에 오류가 발생하면 잠금이 해제되지 않습니다. 이는 잠금 획득과 releaseLock() 호출 사이에 오류(예: HTTP 예외)를 발생시킬 수 있는 여러 작업이 존재하는 buyTheme.handler.ts 및 buyItem.handler.ts에서 분명합니다.
    const lock = await this.redisService.acquireLock(lockKey, ttl);

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
