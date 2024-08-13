import { Test, TestingModule } from '@nestjs/testing';
import { ReviewService } from '../review.service';
import { ReviewRepository } from '../review.repository';
import { CreateEssayReqDto } from '../../essay/dto/request/createEssayReq.dto';
import { UpdateEssayReqDto } from '../../essay/dto/request/updateEssayReq.dto';
import { User } from '../../../entities/user.entity';
import { Essay } from '../../../entities/essay.entity';
import { EssayStatus, ReviewQueueType } from '../../../common/types/enum.types';

jest.mock('../review.repository');

describe('ReviewService', () => {
  let service: ReviewService;
  let reviewRepository: jest.Mocked<ReviewRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReviewService, ReviewRepository],
    }).compile();

    service = module.get<ReviewService>(ReviewService);
    reviewRepository = module.get(ReviewRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('saveReviewRequest', () => {
    it('should save a review request for published status', async () => {
      const user = { id: 1 } as User;
      const essay = { id: 1, status: EssayStatus.PUBLISHED } as Essay;
      const data = { status: EssayStatus.PUBLISHED } as CreateEssayReqDto;

      reviewRepository.saveReviewRequest.mockResolvedValue(undefined);

      await service.saveReviewRequest(user, essay, data);

      expect(reviewRepository.saveReviewRequest).toHaveBeenCalledWith(
        user,
        essay,
        ReviewQueueType.PUBLISHED,
      );
    });

    it('should save a review request for linkedout status', async () => {
      const user = { id: 1 } as User;
      const essay = { id: 1, status: EssayStatus.LINKEDOUT } as Essay;
      const data = { status: EssayStatus.LINKEDOUT } as UpdateEssayReqDto;

      reviewRepository.saveReviewRequest.mockResolvedValue(undefined);

      await service.saveReviewRequest(user, essay, data);

      expect(reviewRepository.saveReviewRequest).toHaveBeenCalledWith(
        user,
        essay,
        ReviewQueueType.LINKEDOUT,
      );
    });

    it('should not save a review request for other statuses', async () => {
      const user = { id: 1 } as User;
      const essay = { id: 1, status: EssayStatus.PRIVATE } as Essay;
      const data = { status: EssayStatus.PRIVATE } as CreateEssayReqDto;

      await service.saveReviewRequest(user, essay, data);

      expect(reviewRepository.saveReviewRequest).not.toHaveBeenCalled();
    });
  });

  describe('mapEssayStatusToReviewQueueType', () => {
    it('should return ReviewQueueType.PUBLISHED for EssayStatus.PUBLISHED', () => {
      const result = service['mapEssayStatusToReviewQueueType'](EssayStatus.PUBLISHED);
      expect(result).toBe(ReviewQueueType.PUBLISHED);
    });

    it('should return ReviewQueueType.LINKEDOUT for EssayStatus.LINKEDOUT', () => {
      const result = service['mapEssayStatusToReviewQueueType'](EssayStatus.LINKEDOUT);
      expect(result).toBe(ReviewQueueType.LINKEDOUT);
    });

    it('should return null for other statuses', () => {
      const result = service['mapEssayStatusToReviewQueueType'](EssayStatus.PRIVATE);
      expect(result).toBeNull();
    });
  });

  describe('findReviewByEssayId', () => {
    it('should return a review by essay id', async () => {
      const essayId = 1;
      const review = { id: 1 } as any;

      reviewRepository.findReviewByEssayId.mockResolvedValue(review);

      const result = await service.findReviewByEssayId(essayId);

      expect(reviewRepository.findReviewByEssayId).toHaveBeenCalledWith(essayId);
      expect(result).toBe(review);
    });
  });
});
