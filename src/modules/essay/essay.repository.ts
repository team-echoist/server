import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEssayDto } from './dto/createEssay.dto';
import { User } from '../../entities/user.entity';
import { Essay } from '../../entities/essay.entity';
import { ReviewQueue } from '../../entities/reviewQueue.entity';
import { UpdateEssayReqDto } from './dto/updateEssayReq.dto';
import { FindMyEssayQueryInterface } from '../../common/interfaces/essay/findMyEssayQuery.interface';

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
    return await this.essayRepository.save(data);
  }

  async createReviewRequest(user: User, essay: Essay, type: 'published' | 'linked_out') {
    await this.reviewRepository.save({
      user: user,
      essay: essay,
      type: type,
    });
    return;
  }

  async findReviewByEssayId(essayId: number) {
    return this.reviewRepository.findOne({ where: { essay: { id: essayId }, processed: false } });
  }

  async updateEssay(essay: Essay, data: UpdateEssayReqDto) {
    const essayData = this.essayRepository.create({ ...essay, ...data });
    return await this.essayRepository.save(essayData);
  }

  async findMyEssay(query: FindMyEssayQueryInterface, page: number, limit: number) {
    const [essays, total] = await this.essayRepository.findAndCount({
      where: query,
      skip: (page - 1) * limit,
      take: limit,
      order: {
        createdDate: 'DESC',
      },
    });

    return { essays, total };
  }

  async deleteEssay(essay: Essay) {
    await this.essayRepository.delete(essay);
    return;
  }
}
