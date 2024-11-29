import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import Redlock, { Lock } from 'redlock';
import { Transactional } from 'typeorm-transactional';

import { Item } from '../../../../../entities/item.entity';
import { Theme } from '../../../../../entities/theme.entity';
import { UserHomeItem } from '../../../../../entities/userHomeItem.entity';
import { UserHomeLayout } from '../../../../../entities/userHomeLayout.entity';
import { UserTheme } from '../../../../../entities/userTheme.entity';
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
    private readonly userService: UserService,
    private readonly utilsService: ToolService,
    @Inject('REDLOCK') private readonly redlock: Redlock,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  private async acquireLock(lockKey: string, ttl: number) {
    try {
      return await this.redlock.acquire([lockKey], ttl);
    } catch (err) {
      throw new HttpException(
        '락을 획득할 수 없습니다. 잠시 후 다시 시도하세요.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private async releaseLock(lock: Lock) {
    try {
      await lock.release();
    } catch (err) {
      console.error('락 해제 실패:', err);
    }
  }

  async todayGeulroquis() {
    const url = await this.geulroquisService.todayGeulroquis();
    return { url: url };
  }

  @Transactional()
  async getThemes(userId: number) {
    const cachedThemes = await this.redis.get('linkedout:themes');

    let allThemes: Theme[];

    if (cachedThemes) {
      allThemes = JSON.parse(cachedThemes);
    } else {
      allThemes = await this.homeRepository.findAllThemes();
      await this.redis.set('linkedout:themes', JSON.stringify(allThemes));
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

    const themesDto = this.utilsService.transformToDto(ThemeResDto, themesWithOwnershipAndActive);
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

  async buyTheme(userId: number, themeId: number) {
    const lockKey = `buyThemeLock:${userId}`;
    const ttl = 10000;

    const lock = await this.acquireLock(lockKey, ttl);

    try {
      await this.executeBuyThemeTransaction(userId, themeId);
    } catch (err) {
      throw new HttpException('테마 구매중 오류가 발생했습니다.', HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      await this.releaseLock(lock);
    }
  }

  @Transactional()
  private async executeBuyThemeTransaction(userId: number, themeId: number) {
    const user = await this.userService.fetchUserEntityById(userId);
    const userThemes = await this.homeRepository.findUserThemes(userId);

    const alreadyOwned = userThemes.some((userTheme) => userTheme.theme.id === themeId);
    if (alreadyOwned) throw new HttpException('이미 소유한 테마입니다.', HttpStatus.BAD_REQUEST);

    const theme = await this.homeRepository.findThemeById(themeId);
    if (!theme) throw new HttpException('존재하지 않는 테마입니다.', HttpStatus.BAD_REQUEST);

    if (user.gems < theme.price) {
      throw new HttpException('재화가 부족합니다.', HttpStatus.BAD_REQUEST);
    }

    user.gems -= theme.price;

    await this.homeRepository.saveNewUserTheme(user, theme);
    await this.homeRepository.createNewUserHomeLayout(user, theme);

    await this.userService.updateUser(userId, user);
  }

  async getItems(userId: number, themeId: number, position: string) {
    const cacheKey = `items:theme:${themeId}:${position || 'all'}`;

    let items: Item[] | null = null;
    const cachedItems = await this.redis.get(cacheKey);

    if (cachedItems) {
      items = JSON.parse(cachedItems);
    }

    if (!items) {
      items = await this.homeRepository.findItemsByThemeAndPosition(themeId, position);

      await this.redis.set(cacheKey, JSON.stringify(items));
    }

    const userItems = await this.homeRepository.findUserItemsByTheme(userId, themeId);

    const userItemIds = new Set(userItems.map((userItem) => userItem.item.id));

    const itemsWithOwnership = items.map((item) => ({
      ...item,
      owned: userItemIds.has(item.id),
    }));

    const itemsDto = this.utilsService.transformToDto(ItemResDto, itemsWithOwnership);
    return { items: itemsDto };
  }

  async buyItem(userId: number, itemId: number) {
    const lockKey = `buy-item-lock:${userId}`;
    const ttl = 10000;

    const lock = await this.acquireLock(lockKey, ttl);

    try {
      await this.executeBuyItemTransaction(userId, itemId);
    } catch (err) {
      throw new HttpException(
        '아이템 구매 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await this.releaseLock(lock);
    }
  }

  @Transactional()
  private async executeBuyItemTransaction(userId: number, itemId: number) {
    const user = await this.userService.fetchUserEntityById(userId);
    const userItems = await this.homeRepository.findUserItems(userId);

    const alreadyOwned = userItems.some((userItem) => userItem.item.id === itemId);
    if (alreadyOwned) throw new HttpException('이미 소유한 아이템입니다.', HttpStatus.BAD_REQUEST);

    const item = await this.homeRepository.findItemById(itemId);
    if (!item) throw new HttpException('존재하지 않는 아이템입니다.', HttpStatus.BAD_REQUEST);

    if (user.gems < item.price) {
      throw new HttpException('재화가 부족합니다.', HttpStatus.BAD_REQUEST);
    }

    user.gems -= item.price;

    await this.homeRepository.saveNewUserItem(user, item);
    await this.userService.updateUser(userId, user);
  }

  @Transactional()
  async changeTheme(userId: number, themeId: number): Promise<void> {
    const userThemes = await this.homeRepository.findUserThemes(userId);
    await this.checkUserOwnsTheme(userThemes, themeId);

    const currentLayout = await this.homeRepository.findUserCurrentLayout(userId);
    if (currentLayout) {
      currentLayout.isActive = false;
      await this.homeRepository.saveUserHomeLayout(currentLayout);
    }

    const newLayout = await this.homeRepository.findUserActivateLayout(userId, themeId);
    if (!newLayout) {
      throw new HttpException(
        '해당 테마에 대한 레이아웃이 존재하지 않습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    newLayout.isActive = true;
    await this.homeRepository.saveUserHomeLayout(newLayout);
    await this.redis.del(`user:${userId}`);
  }

  private async checkUserOwnsTheme(userThemes: UserTheme[], themeId: number): Promise<void> {
    const ownsTheme = userThemes.some((userTheme) => userTheme.theme.id === themeId);
    if (!ownsTheme) {
      throw new HttpException('해당 테마를 소유하고 있지 않습니다.', HttpStatus.BAD_REQUEST);
    }
  }

  @Transactional()
  async activateItem(userId: number, itemId: number) {
    // 현재 활성화된 레이아웃 가져오기
    const activeLayout = await this.homeRepository.findUserCurrentHomeLayout(userId);

    if (!activeLayout) {
      throw new HttpException('활성화된 레이아웃이 없습니다.', HttpStatus.BAD_REQUEST);
    }

    // 아이템 가져오기 및 검증
    const item = await this.homeRepository.findItemById(itemId);
    if (!item || item.theme.id !== activeLayout.theme.id) {
      throw new HttpException(
        '해당 아이템이 존재하지 않거나, 현재 테마에 속하지 않습니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 사용자가 해당 아이템을 소유했는지 확인
    const userOwnsItem = await this.homeRepository.findUserItemById(userId, itemId);
    if (!userOwnsItem) {
      throw new HttpException('해당 아이템을 소유하고 있지 않습니다.', HttpStatus.FORBIDDEN);
    }

    // 같은 포지션에 있는 기존 아이템 비활성화
    const existingItem = activeLayout.homeItems.find(
      (homeItem) => homeItem.item.position === item.position,
    );
    if (existingItem) {
      await this.homeRepository.removeUserHomeItem(existingItem);
    }

    // 새 아이템 활성화
    const newUserHomeItem = new UserHomeItem();
    newUserHomeItem.layout = activeLayout;
    newUserHomeItem.item = item;

    await this.homeRepository.saveUserHomeItem(newUserHomeItem);
    await this.redis.del(`user:${userId}`);
  }
}
