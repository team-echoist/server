import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CategoryRepository } from './category.repository';
import { User } from '../../entities/user.entity';
import { Category } from '../../entities/category.entity';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async getCategoryById(user: User, categoryId?: number): Promise<Category> {
    if (!categoryId) return null;
    const category = await this.categoryRepository.findCategoryById(user, categoryId);
    if (!category) throw new HttpException('Category not found.', HttpStatus.BAD_REQUEST);
    return category;
  }
}
