import { forwardRef, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';

import { Item } from '../../../../../entities/item.entity';
import { Theme } from '../../../../../entities/theme.entity';
import { User } from '../../../../../entities/user.entity';
import { UserHomeItem } from '../../../../../entities/userHomeItem.entity';
import { UserHomeLayout } from '../../../../../entities/userHomeLayout.entity';
import { UserItem } from '../../../../../entities/userItem.entity';
import { UserTheme } from '../../../../../entities/userTheme.entity';
import { RedisService } from '../../../../adapters/redis/core/redis.service';
import { UserService } from '../../../../base/user/core/user.service';
import { ToolService } from '../../../../utils/tool/core/tool.service';
import { GeulroquisService } from '../../../essay/geulroquis/core/geulroquis.service';
import { ItemResDto } from '../dto/response/itemRes.dto';
import { ThemeResDto } from '../dto/response/themeRes.dto';
import { IHomeRepository } from '../infrastructure/ihome.repository';

@Injectable()
export class HomeService {
  constructor(
    @Inject('IHomeRepository') private readonly homeRepository: IHomeRepository,
    private readonly geulroquisService: GeulroquisService,
    private readonly toolService: ToolService,
    @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
    private readonly redisService: RedisService,
  ) {}

  async todayGeulroquis() {
    const url = await this.geulroquisService.todayGeulroquis();
    return { url: url };
  }

  @Transactional()
  async getThemes(userId: number) {
    const cachedThemes = await this.redisService.getCache('linkedout:themes');

    let allThemes: Theme[];

    if (cachedThemes) {
      allThemes = JSON.parse(cachedThemes);
    } else {
      allThemes = await this.homeRepository.findAllThemes();
      await this.redisService.setCache('linkedout:themes', JSON.stringify(allThemes));
    }

    let activeLayout: UserHomeLayout;

    const userThemes = await this.homeRepository.findUserThemes(userId);

    if (userThemes.length === 0) {
      const { userTheme, userLayout } = await this.createDefaultTheme(userId);
      userThemes.push(userTheme);
      activeLayout = userLayout;
    }

    if (!activeLayout) {
      activeLayout = await this.homeRepository.findActiveLayoutByUserId(userId);
    }

    const activeThemeId = activeLayout ? activeLayout.theme.id : null;

    const userThemeIds = new Set(userThemes.map((theme) => theme.theme.id));

    const themesWithOwnershipAndActive = allThemes.map((theme: { id: number }) => ({
      ...theme,
      owned: userThemeIds.has(theme.id),
      isActive: theme.id === activeThemeId,
    }));

    const themesDto = this.toolService.transformToDto(ThemeResDto, themesWithOwnershipAndActive);
    return { themes: themesDto };
  }

  async createDefaultTheme(userId: number) {
    const user = await this.userService.fetchUserEntityById(userId);
    const defaultTheme = await this.homeRepository.findThemeById(1);

    const newDefaultTheme = new UserTheme();
    newDefaultTheme.purchasedDate = new Date();
    newDefaultTheme.user = user;
    newDefaultTheme.theme = defaultTheme;

    const newLayout = new UserHomeLayout();
    newLayout.user = user;
    newLayout.theme = defaultTheme;
    newLayout.isActive = true;

    const userLayout = await this.homeRepository.saveUserHomeLayout(newLayout);
    const userTheme = await this.homeRepository.saveUserTheme(newDefaultTheme);

    return { userTheme, userLayout };
  }

  async getThemePrice(themeId: number): Promise<number> {
    const theme = await this.homeRepository.findThemeById(themeId);
    if (!theme) {
      throw new HttpException('존재하지 않는 테마입니다.', HttpStatus.BAD_REQUEST);
    }
    return theme.price;
  }

  @Transactional()
  async addThemeToUser(user: User, themeId: number): Promise<void> {
    const userThemes = await this.homeRepository.findUserThemes(user.id);

    const alreadyOwned = userThemes.some((userTheme) => userTheme.theme.id === themeId);
    if (alreadyOwned) {
      throw new HttpException('이미 소유한 테마입니다.', HttpStatus.BAD_REQUEST);
    }

    const theme = await this.homeRepository.findThemeById(themeId);
    if (!theme) {
      throw new HttpException('존재하지 않는 테마입니다.', HttpStatus.BAD_REQUEST);
    }

    await this.homeRepository.saveNewUserTheme(user, theme);
    await this.homeRepository.createNewUserHomeLayout(user, theme);
  }

  async getItems(userId: number, themeId: number, position: string) {
    const cacheKey = `items:theme:${themeId}:${position || 'all'}`;

    let items: Item[] | null = null;
    const cachedItems = await this.redisService.getCache(cacheKey);

    if (cachedItems) {
      items = JSON.parse(cachedItems);
    }

    if (!items) {
      items = await this.homeRepository.findItemsByThemeAndPosition(themeId, position);

      await this.redisService.setCache(cacheKey, JSON.stringify(items));
    }

    const userItems = await this.homeRepository.findUserItemsByTheme(userId, themeId);

    const userItemIds = new Set(userItems.map((userItem) => userItem.item.id));

    const itemsWithOwnership = items.map((item) => ({
      ...item,
      owned: userItemIds.has(item.id),
    }));

    const itemsDto = this.toolService.transformToDto(ItemResDto, itemsWithOwnership);
    return { items: itemsDto };
  }

  async getUserItems(userId: number): Promise<UserItem[]> {
    return this.homeRepository.findUserItems(userId);
  }

  async getItemById(itemId: number): Promise<Item | null> {
    return this.homeRepository.findItemById(itemId);
  }

  async addItemToUser(user: User, item: Item): Promise<void> {
    await this.homeRepository.saveNewUserItem(user, item);
  }

  async getUserThemes(userId: number): Promise<UserTheme[]> {
    return this.homeRepository.findUserThemes(userId);
  }

  async getActiveLayout(userId: number): Promise<UserHomeLayout | null> {
    return this.homeRepository.findUserCurrentLayout(userId);
  }

  async deactivateLayout(layout: UserHomeLayout): Promise<void> {
    layout.isActive = false;
    await this.homeRepository.saveUserHomeLayout(layout);
  }

  async getLayoutByTheme(userId: number, themeId: number): Promise<UserHomeLayout | null> {
    return this.homeRepository.findUserActivateLayout(userId, themeId);
  }

  async activateLayout(layout: UserHomeLayout): Promise<void> {
    layout.isActive = true;
    await this.homeRepository.saveUserHomeLayout(layout);
  }

  async clearUserCache(userId: number): Promise<void> {
    await this.redisService.deleteCache(`user:${userId}`);
  }

  async userOwnsItem(userId: number, itemId: number): Promise<boolean> {
    const userItem = await this.homeRepository.findUserItemById(userId, itemId);
    return !!userItem;
  }

  async deactivateItemAtPosition(layout: UserHomeLayout, position: string): Promise<void> {
    const existingItem = layout.homeItems.find((homeItem) => homeItem.item.position === position);
    if (existingItem) {
      await this.homeRepository.removeUserHomeItem(existingItem);
    }
  }

  async activateItemInLayout(layout: UserHomeLayout, item: Item): Promise<void> {
    const newUserHomeItem = new UserHomeItem();
    newUserHomeItem.layout = layout;
    newUserHomeItem.item = item;

    await this.homeRepository.saveUserHomeItem(newUserHomeItem);
  }
}
