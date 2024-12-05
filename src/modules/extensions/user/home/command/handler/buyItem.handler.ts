import { HttpException, HttpStatus } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { Transactional } from 'typeorm-transactional';

import { BuyItemCommand } from '../buyItem.command';
import { BaseCommandHandler } from './base/baseCommand.handler';

@CommandHandler(BuyItemHandler)
export class BuyItemHandler extends BaseCommandHandler<BuyItemCommand> {
  @Transactional()
  async execute(command: BuyItemCommand) {
    const { userId, itemId } = command;

    const lockKey = `buy-item-lock:${userId}`;
    const ttl = 10000;

    const lock = await this.redisService.acquireLock(lockKey, ttl);

    // todo useScopeExit의 현재 구현은 반환된 함수가 명시적으로 호출될 때만 정리를 실행합니다. releaseLock()이 호출되기 전에 오류가 발생하면 잠금이 해제되지 않습니다. 이는 잠금 획득과 releaseLock() 호출 사이에 오류(예: HTTP 예외)를 발생시킬 수 있는 여러 작업이 존재하는 buyTheme.handler.ts 및 buyItem.handler.ts에서 분명합니다.
    const releaseLock = this.toolService.useScopeExit(() => this.redisService.releaseLock(lock));

    const user = await this.userService.fetchUserEntityById(userId);
    const userItems = await this.homeService.getUserItems(userId);

    if (userItems.some((userItem) => userItem.id === itemId))
      throw new HttpException('이미 소유한 아이템입니다.', HttpStatus.BAD_REQUEST);

    const item = await this.homeService.getItemById(itemId);
    if (!item) throw new HttpException('존재하지 않는 아이템입니다.', HttpStatus.BAD_REQUEST);

    if (user.gems < item.price)
      throw new HttpException('재화가 부족합니다.', HttpStatus.BAD_REQUEST);

    user.gems -= item.price;
    await this.homeService.addItemToUser(user, item);
    await this.userService.updateUser(userId, user);

    await this.homeService.clearUserCache(userId);

    releaseLock();
  }
}
