import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../entities/category.entity';
import { User } from '../../entities/user.entity';

export class CategoryRepository {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async findCategoryById(user: User, categoryId: number) {
    return this.categoryRepository.findOne({ where: { id: categoryId, user: user } });
  }
}
