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
    const cachedThemes = await this.redis.get('linkedout:theme');

    let allThemes: Theme[];

    if (cachedThemes) {
      allThemes = JSON.parse(cachedThemes);
    } else {
      allThemes = await this.homeRepository.findAllThemes();
      await this.redis.set('linkedout:theme', JSON.stringify(allThemes));
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

    const newUserTheme = new UserTheme();
    newUserTheme.purchasedDate = new Date();
    newUserTheme.theme = theme;
    newUserTheme.user = user;

    await this.homeRepository.saveUserTheme(newUserTheme);
  }
}
