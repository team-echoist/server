import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReviewService } from './core/review.service';
import { ReviewRepository } from './infrastructure/review.repository';
import { Essay } from '../../../../entities/essay.entity';
import { ReviewQueue } from '../../../../entities/reviewQueue.entity';
import { User } from '../../../../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Essay, ReviewQueue])],
  providers: [ReviewService, { provide: 'IReviewRepository', useClass: ReviewRepository }],
  exports: [ReviewService, { provide: 'IReviewRepository', useClass: ReviewRepository }],
})
export class ReviewModule {}
