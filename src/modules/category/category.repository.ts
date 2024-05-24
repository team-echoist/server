import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../entities/category.entity';
import { User } from '../../entities/user.entity';

export class CategoryRepository {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async findCategoryById(userId: number, categoryId: number) {
    return this.categoryRepository.findOne({ where: { id: categoryId, user: { id: userId } } });
  }

  async getCategoriesById(userId: number) {
    return this.categoryRepository.find({ where: { user: { id: userId } } });
  }

  async saveCategory(category: Category) {
    return this.categoryRepository.save(category);
  }

  async deleteCategory(category: Category) {
    return this.categoryRepository.remove(category);
  }
}
