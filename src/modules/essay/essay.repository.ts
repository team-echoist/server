import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { EssayResDto } from './dto/essayRes.dto';
import { CreateEssayDto } from './dto/createEssay.dto';
import { User } from '../../entities/user.entity';
import { Essay } from '../../entities/essay.entity';
import { ReviewQueue } from '../../entities/reviewQueue.entity';
import { UpdateEssayReqDto } from './dto/updateEssayReq.dto';

export class EssayRepository {
  constructor(
    @InjectRepository(Essay)
    private readonly essayRepository: Repository<Essay>,
    @InjectRepository(ReviewQueue)
    private readonly reviewRepository: Repository<ReviewQueue>,
  ) {}

  async findEssayById(essayId: number) {
    return await this.essayRepository.findOne({ where: { id: essayId }, relations: ['author'] });
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

  async findReviewByEssayId(essayId: number) {
    return this.reviewRepository.findOne({ where: { essay: { id: essayId }, completed: false } });
  }

  async updateEssay(essay: Essay, data: UpdateEssayReqDto) {
    const essayData = this.essayRepository.create({ ...essay, ...data });
    const updatedEssay = await this.essayRepository.save(essayData);

    return plainToInstance(
      EssayResDto,
      { ...updatedEssay, authorId: updatedEssay.author.id },
      {
        strategy: 'exposeAll',
        excludeExtraneousValues: true,
      },
    );
  }
}
