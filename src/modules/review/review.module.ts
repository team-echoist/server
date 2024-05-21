import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { Essay } from '../../entities/essay.entity';
import { ReviewQueue } from '../../entities/reviewQueue.entity';
import { ReviewService } from './review.service';
import { ReviewRepository } from './review.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User, Essay, ReviewQueue])],
  providers: [ReviewService, ReviewRepository],
  exports: [ReviewService, ReviewRepository],
})
export class ReviewModule {}
