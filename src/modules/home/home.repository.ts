import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from '../../entities/item.entity';
import { Theme } from '../../entities/theme.entity';
import { UserTheme } from '../../entities/userTheme.entity';
import { User } from '../../entities/user.entity';

export class HomeRepository {
  constructor(
    @InjectRepository(Item) private readonly itemRepository: Repository<Item>,
    @InjectRepository(Theme) private readonly themeRepository: Repository<Theme>,
    @InjectRepository(UserTheme) private readonly userThemeRepository: Repository<UserTheme>,
  ) {}

  async findUserThemes(userId: number) {
    return this.userThemeRepository.find({ where: { user: { id: userId } } });
  }

  async findThemeById(themeId: number) {
    return this.themeRepository.findOne({ where: { id: themeId } });
  }

  async saveUserTheme(userTheme: UserTheme) {
    return this.userThemeRepository.save(userTheme);
  }

  async findAllThemes() {
    return this.themeRepository.find();
  }
}
