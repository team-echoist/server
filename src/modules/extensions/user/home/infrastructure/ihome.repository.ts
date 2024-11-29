import { Item } from '../../../../../entities/item.entity';
import { Theme } from '../../../../../entities/theme.entity';
import { User } from '../../../../../entities/user.entity';
import { UserHomeItem } from '../../../../../entities/userHomeItem.entity';
import { UserHomeLayout } from '../../../../../entities/userHomeLayout.entity';
import { UserItem } from '../../../../../entities/userItem.entity';
import { UserTheme } from '../../../../../entities/userTheme.entity';

export interface IHomeRepository {
  findUserThemes(userId: number): Promise<UserTheme[]>;

  findUserItems(userId: number): Promise<UserItem[]>;

  findThemeById(themeId: number): Promise<Theme>;

  findItemById(itemId: number): Promise<Item>;

  saveUserTheme(userTheme: UserTheme): Promise<UserTheme>;

  saveUserItem(userItem: UserItem): Promise<UserItem>;

  findAllThemes(): Promise<Theme[]>;

  findUserItemsByTheme(userId: number, themeId: number): Promise<UserItem[]>;

  findItemsByThemeAndPosition(themeId: number, position?: string): Promise<Item[]>;

  saveUserHomeLayout(userHomeLayout: UserHomeLayout): Promise<UserHomeLayout>;

  findActiveLayoutByUserId(userId: number): Promise<UserHomeLayout | null>;

  createNewUserHomeLayout(user: User, theme: Theme): Promise<UserHomeLayout>;

  saveNewUserTheme(user: User, theme: Theme): Promise<UserTheme>;

  saveNewUserItem(user: User, item: Item): Promise<UserItem>;

  findUserCurrentLayout(userId: number): Promise<UserHomeLayout>;

  findUserActivateLayout(userId: number, themeId: number): Promise<UserHomeLayout>;

  findUserCurrentHomeLayout(userId: number): Promise<UserHomeLayout>;

  findUserItemById(userId: number, itemId: number): Promise<UserItem>;

  removeUserHomeItem(item: UserHomeItem): Promise<UserHomeItem>;

  saveUserHomeItem(item: UserHomeItem): Promise<UserHomeItem>;
}
