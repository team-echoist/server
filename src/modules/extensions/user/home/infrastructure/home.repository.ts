import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from '../../../../../entities/item.entity';
import { Theme } from '../../../../../entities/theme.entity';
import { UserTheme } from '../../../../../entities/userTheme.entity';
import { UserItem } from '../../../../../entities/userItem.entity';
import { UserHomeLayout } from '../../../../../entities/userHomeLayout.entity';
import { UserHomeItem } from '../../../../../entities/userHomeItem.entity';
import { User } from '../../../../../entities/user.entity';
import { IHomeRepository } from './ihome.repository';

export class HomeRepository implements IHomeRepository {
  constructor(
    @InjectRepository(Item) private readonly itemRepository: Repository<Item>,
    @InjectRepository(Theme) private readonly themeRepository: Repository<Theme>,
    @InjectRepository(UserTheme) private readonly userThemeRepository: Repository<UserTheme>,
    @InjectRepository(UserItem) private readonly userItemRepository: Repository<UserItem>,
    @InjectRepository(UserHomeLayout)
    private readonly userHomeLayoutRepository: Repository<UserHomeLayout>,
    @InjectRepository(UserHomeItem)
    private readonly userHomeItemRepository: Repository<UserHomeItem>,
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
    return this.itemRepository.findOne({ where: { id: itemId }, relations: ['theme'] });
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

  async saveUserHomeLayout(userHomeLayout: UserHomeLayout) {
    return this.userHomeLayoutRepository.save(userHomeLayout);
  }

  async findActiveLayoutByUserId(userId: number): Promise<UserHomeLayout | null> {
    return this.userHomeLayoutRepository.findOne({
      where: { user: { id: userId }, isActive: true },
      relations: ['theme'],
    });
  }

  async createNewUserHomeLayout(user: User, theme: Theme): Promise<UserHomeLayout> {
    const newUserLayout = new UserHomeLayout();
    newUserLayout.user = user;
    newUserLayout.theme = theme;
    newUserLayout.isActive = false;
    return this.userHomeLayoutRepository.save(newUserLayout);
  }

  async saveNewUserTheme(user: User, theme: Theme): Promise<UserTheme> {
    const newUserTheme = new UserTheme();
    newUserTheme.purchasedDate = new Date();
    newUserTheme.theme = theme;
    newUserTheme.user = user;
    return this.userThemeRepository.save(newUserTheme);
  }

  async saveNewUserItem(user: User, item: Item) {
    const newUserItem = new UserItem();
    newUserItem.purchasedDate = new Date();
    newUserItem.item = item;
    newUserItem.user = user;
    return this.userItemRepository.save(newUserItem);
  }

  async findUserCurrentLayout(userId: number) {
    return this.userHomeLayoutRepository.findOne({
      where: { user: { id: userId }, isActive: true },
    });
  }

  async findUserActivateLayout(userId: number, themeId: number) {
    return this.userHomeLayoutRepository.findOne({
      where: { user: { id: userId }, theme: { id: themeId } },
    });
  }

  async findUserCurrentHomeLayout(userId: number) {
    return this.userHomeLayoutRepository.findOne({
      where: { user: { id: userId }, isActive: true },
      relations: ['homeItems', 'homeItems.item', 'theme'],
    });
  }

  async findUserItemById(userId: number, itemId: number) {
    return this.userItemRepository.findOne({
      where: { user: { id: userId }, item: { id: itemId } },
    });
  }

  async removeUserHomeItem(item: UserHomeItem) {
    return this.userHomeItemRepository.remove(item);
  }

  async saveUserHomeItem(item: UserHomeItem) {
    return this.userHomeItemRepository.save(item);
  }
}
