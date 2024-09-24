import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from '../../entities/item.entity';
import { Theme } from '../../entities/theme.entity';
import { UserTheme } from '../../entities/userTheme.entity';
import { UserItem } from '../../entities/userItem.entity';

export class HomeRepository {
  constructor(
    @InjectRepository(Item) private readonly itemRepository: Repository<Item>,
    @InjectRepository(Theme) private readonly themeRepository: Repository<Theme>,
    @InjectRepository(UserTheme) private readonly userThemeRepository: Repository<UserTheme>,
    @InjectRepository(UserItem) private readonly userItemRepository: Repository<UserItem>,
  ) {}

  async findUserThemes(userId: number) {
    return this.userThemeRepository.find({
      where: { user: { id: userId } },
      relations: ['theme'],
    });
  }

  async findUserItems(userId: number) {
    return this.userItemRepository.find({ where: { user: { id: userId } }, relations: ['item'] });
  }

  async findThemeById(themeId: number) {
    return this.themeRepository.findOne({ where: { id: themeId } });
  }

  async findItemById(itemId: number) {
    return this.itemRepository.findOne({ where: { id: itemId } });
  }

  async saveUserTheme(userTheme: UserTheme) {
    return this.userThemeRepository.save(userTheme);
  }

  async saveUserItem(userItem: UserItem) {
    return this.userItemRepository.save(userItem);
  }

  async findAllThemes() {
    return this.themeRepository.find();
  }

  async findUserItemsByTheme(userId: number, themeId: number): Promise<UserItem[]> {
    return this.userItemRepository.find({
      where: { user: { id: userId }, item: { theme: { id: themeId } } },
      relations: ['item'],
    });
  }

  async findItemsByThemeAndPosition(themeId: number, position?: string): Promise<Item[]> {
    const queryBuilder = this.itemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.theme', 'theme')
      .where('item.theme.id = :themeId', { themeId });

    if (position) {
      queryBuilder.andWhere('item.position = :position', { position });
    }

    return queryBuilder.getMany();
  }
}
