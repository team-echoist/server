import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HomeRepository } from './home.repository';
import { GeulroquisService } from '../geulroquis/geulroquis.service';
import { UserService } from '../user/user.service';
import { UserTheme } from '../../entities/userTheme.entity';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { UtilsService } from '../utils/utils.service';
import { ThemeResDto } from './dto/response/themeRes.dto';
import { Theme } from '../../entities/theme.entity';
import { Transactional } from 'typeorm-transactional';
import { Item } from '../../entities/item.entity';
import { ItemResDto } from './dto/response/itemRes.dto';
import { UserItem } from '../../entities/userItem.entity';

@Injectable()
export class HomeService {
  constructor(
    private readonly homeRepository: HomeRepository,
    private readonly geulroquisService: GeulroquisService,
    private readonly userService: UserService,
    private readonly utilsService: UtilsService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

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

    const userThemes = await this.homeRepository.findUserThemes(userId);
    if (userThemes.length === 0) {
      const defaultTheme = await this.createDefaultTheme(userId);
      userThemes.push(defaultTheme);
    }

    const userThemeIds = new Set(userThemes.map((theme) => theme.theme.id));

    const themesWithOwnership = allThemes.map((theme: { id: number }) => ({
      ...theme,
      owned: userThemeIds.has(theme.id),
    }));

    const themesDto = this.utilsService.transformToDto(ThemeResDto, themesWithOwnership);
    return { themes: themesDto };
  }

  async createDefaultTheme(userId: number) {
    const user = await this.userService.fetchUserEntityById(userId);
    const defaultTheme = await this.homeRepository.findThemeById(1);

    const newDefaultTheme = new UserTheme();
    newDefaultTheme.purchasedDate = new Date();
    newDefaultTheme.user = user;
    newDefaultTheme.theme = defaultTheme;

    return await this.homeRepository.saveUserTheme(newDefaultTheme);
  }

  @Transactional()
  async buyTheme(userId: number, themeId: number) {
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

    const newUserTheme = new UserTheme();
    newUserTheme.purchasedDate = new Date();
    newUserTheme.theme = theme;
    newUserTheme.user = user;

    await this.homeRepository.saveUserTheme(newUserTheme);
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

  @Transactional()
  async buyItem(userId: number, itemId: number) {
    const user = await this.userService.fetchUserEntityById(userId);

    const userItems = await this.homeRepository.findUserItems(userId);

    const alreadyOwned = userItems.some((userItem) => userItem.item.id === itemId);
    if (alreadyOwned) {
      throw new HttpException('이미 소유한 아이템입니다.', HttpStatus.BAD_REQUEST);
    }

    const item = await this.homeRepository.findItemById(itemId);
    if (!item) {
      throw new HttpException('존재하지 않는 아이템입니다.', HttpStatus.BAD_REQUEST);
    }

    if (user.gems < item.price) {
      throw new HttpException('재화가 부족합니다.', HttpStatus.BAD_REQUEST);
    }

    user.gems -= item.price;

    const newUserItem = new UserItem();
    newUserItem.purchasedDate = new Date();
    newUserItem.item = item;
    newUserItem.user = user;

    await this.homeRepository.saveUserItem(newUserItem);

    await this.userService.updateUser(userId, user);
  }
}
