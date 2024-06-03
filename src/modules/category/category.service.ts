import { forwardRef, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CategoryRepository } from './category.repository';
import { User } from '../../entities/user.entity';
import { Category } from '../../entities/category.entity';
import { CategoriesDto } from './dto/categories.dto';
import { UtilsService } from '../utils/utils.service';
import { UserService } from '../user/user.service';

@Injectable()
export class CategoryService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly utilsService: UtilsService,
    @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
  ) {}

  async getCategoryById(user: User, categoryId?: number): Promise<Category> {
    if (!categoryId) return null;
    const category = await this.categoryRepository.findCategoryById(user.id, categoryId);
    if (!category) throw new HttpException('Category not found.', HttpStatus.BAD_REQUEST);
    return category;
  }

  async getCategoriesByUserId(userId: number) {
    const categories = await this.categoryRepository.getCategoriesById(userId);
    return this.utilsService.transformToDto(CategoriesDto, categories);
  }

  async saveCategory(userId: number, name: string) {
    const user = await this.userService.fetchUserEntityById(userId);
    return await this.saveCategoryWithUser(user, name);
  }

  async updateCategory(userId: number, categoryId: number, categoryName: string) {
    const category: Category = await this.categoryRepository.findCategoryById(userId, categoryId);
    category.name = categoryName;
    await this.categoryRepository.saveCategory(category);
  }

  async saveCategoryWithUser(user: User, categoryName: string) {
    const category = new Category();
    category.name = categoryName;
    category.user = user;
    return await this.categoryRepository.saveCategory(category);
  }

  async deleteCategory(userId: number, categoryId: number) {
    const category: Category = await this.categoryRepository.findCategoryById(userId, categoryId);
    await this.categoryRepository.deleteCategory(category);
  }
}
