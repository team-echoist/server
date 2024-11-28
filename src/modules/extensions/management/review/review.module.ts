import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../../../entities/user.entity';
import { Essay } from '../../../../entities/essay.entity';
import { ReviewQueue } from '../../../../entities/reviewQueue.entity';
import { ReviewService } from './core/review.service';
import { ReviewRepository } from './infrastructure/review.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User, Essay, ReviewQueue])],
  providers: [ReviewService, { provide: 'IReviewRepository', useClass: ReviewRepository }],
  exports: [ReviewService, { provide: 'IReviewRepository', useClass: ReviewRepository }],
})
export class ReviewModule {}
