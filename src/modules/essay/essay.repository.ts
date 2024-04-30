import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { EssayResDto } from './dto/essayRes.dto';
import { CreateEssayDto } from './dto/createEssay.dto';
import { User } from '../../entities/user.entity';
import { Essay } from '../../entities/essay.entity';
import { ReviewQueue } from '../../entities/reviewQueue.entity';

export class EssayRepository {
  constructor(
    @InjectRepository(Essay)
    private readonly essayRepository: Repository<Essay>,
    @InjectRepository(ReviewQueue)
    private readonly reviewRepository: Repository<ReviewQueue>,
  ) {}

  async findEssayById(essayId: number) {
    return await this.essayRepository.findOne({ where: { id: essayId } });
  }

  async createEssay(data: CreateEssayDto) {
    const essay = await this.essayRepository.save(data);

    return plainToInstance(
      EssayResDto,
      { ...essay, authorId: essay.author.id },
      { strategy: 'exposeAll', excludeExtraneousValues: true },
    );
  }

  async createReviewRequest(user: User, essay: Essay, type: 'publish' | 'linked_out') {
    await this.reviewRepository.save({
      user: user,
      essay: essay,
      type: type,
    });
    return;
  }
}
