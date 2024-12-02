import { HttpException, HttpStatus } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { Transactional } from 'typeorm-transactional';

import { ActivateItemCommand } from '../activateItem.command';
import { BaseCommandHandler } from './base/baseCommand.handler';

@CommandHandler(ActivateItemCommand)
export class ActivateItemHandler extends BaseCommandHandler<ActivateItemCommand> {
  @Transactional()
  async execute(command: ActivateItemCommand) {
    const { userId, itemId } = command;

    const activeLayout = await this.homeService.getActiveLayout(userId);
    if (!activeLayout) {
      throw new HttpException('활성화된 레이아웃이 없습니다.', HttpStatus.BAD_REQUEST);
    }

    const item = await this.homeService.getItemById(itemId);
    if (!item || item.theme.id !== activeLayout.theme.id) {
      throw new HttpException(
        '해당 아이템이 존재하지 않거나, 현재 테마에 속하지 않습니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const userOwnsItem = await this.homeService.userOwnsItem(userId, itemId);
    if (!userOwnsItem) {
      throw new HttpException('해당 아이템을 소유하고 있지 않습니다.', HttpStatus.FORBIDDEN);
    }

    await this.homeService.deactivateItemAtPosition(activeLayout, item.position);

    await this.homeService.activateItemInLayout(activeLayout, item);

    await this.homeService.clearUserCache(userId);
  }
}
