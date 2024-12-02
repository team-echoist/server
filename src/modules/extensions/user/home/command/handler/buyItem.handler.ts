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
    const releaseLock = this.toolService.useScopeExit(() => this.redisService.releaseLock(lock));

    const user = await this.userService.fetchUserEntityById(userId);
    const userItems = await this.homeService.getUserItems(userId);

    if (userItems.some((userItem) => userItem.id === itemId))
      throw new HttpException('이미 소유한 아이템입니다.', HttpStatus.BAD_REQUEST);

    const item = await this.homeService.getItemById(itemId);
    if (item) throw new HttpException('존재하지 않는 아이템입니다.', HttpStatus.BAD_REQUEST);

    if (user.gems < item.price)
      throw new HttpException('재화가 부족합니다.', HttpStatus.BAD_REQUEST);

    user.gems -= item.price;
    await this.homeService.addItemToUser(user, item);
    await this.userService.updateUser(userId, user);

    await this.homeService.clearUserCache(userId);

    releaseLock();
  }
}
