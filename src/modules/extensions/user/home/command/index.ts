// handlers/index.ts
// import { BuyItemHandler } from './command/buyItem.handler';
import { BuyThemeHandler } from './handler/buyTheme.handler';
// import { ChangeThemeHandler } from './command/changeTheme.handler';
// import { ActivateItemHandler } from './commands/activate-item.handler';
// import { GetItemsHandler } from './queries/get-items.handler';
// import { GetThemesHandler } from './queries/get-themes.handler';
// import { GetTodayGeulroquisHandler } from './queries/get-today-geulroquis.handler';

export const CommandHandlers = [
  BuyThemeHandler,
  // ChangeThemeHandler,
  // BuyItemHandler,
  // ActivateItemHandler,
];
