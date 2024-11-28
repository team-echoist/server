import { Test, TestingModule } from '@nestjs/testing';
import { ReviewService } from '../review.service';
import { ReviewRepository } from '../review.repository';

jest.mock('../review.repository');

describe('ReviewService', () => {
  let service: ReviewService;
  let reviewRepository: jest.Mocked<ReviewRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReviewService, ReviewRepository],
    }).compile();

    service = module.get<ReviewService>(ReviewService);
    reviewRepository = module.get(ReviewRepository) as jest.Mocked<ReviewRepository>;
  });
});
