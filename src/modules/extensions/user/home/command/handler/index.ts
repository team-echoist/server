import { ActivateItemHandler } from './activateItem.handler';
import { BuyItemHandler } from './buyItem.handler';
import { BuyThemeHandler } from './buyTheme.handler';
import { ChangeThemeHandler } from './changeTheme.handler';

export const CommandHandlers = [
  BuyThemeHandler,
  ChangeThemeHandler,
  BuyItemHandler,
  ActivateItemHandler,
];
