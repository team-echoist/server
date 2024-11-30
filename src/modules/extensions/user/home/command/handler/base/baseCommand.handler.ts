import { ICommandHandler } from '@nestjs/cqrs';

import { UserService } from '../../../../../../base/user/core/user.service';
import { ToolService } from '../../../../../../utils/tool/core/tool.service';
import { HomeService } from '../../../core/home.service';

export abstract class BaseCommandHandler<TCommand> implements ICommandHandler<TCommand> {
  constructor(
    protected readonly userService: UserService,
    protected readonly homeService: HomeService,
    protected readonly toolService: ToolService,
  ) {}

  abstract execute(command: TCommand): Promise<any>;
}
