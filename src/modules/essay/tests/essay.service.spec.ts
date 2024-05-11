import { Test, TestingModule } from '@nestjs/testing';
import { EssayService } from '../essay.service';
import { EssayRepository } from '../essay.repository';
import { UserRepository } from '../../user/user.repository';
import { HttpException, HttpStatus } from '@nestjs/common';
import { User } from '../../../entities/user.entity';
import { Essay } from '../../../entities/essay.entity';
import { Category } from '../../../entities/category.entity';
import { CreateEssayReqDto } from '../dto/request/createEssayReq.dto';
import { ReviewQueue } from '../../../entities/reviewQueue.entity';

jest.mock('typeorm-transactional', () => ({
  initializeTransactionalContext: jest.fn(),
  patchTypeORMRepositoryWithBaseRepository: jest.fn(),
  Transactional: () => (target, key, descriptor: any) => descriptor,
}));

describe('EssayService', () => {
  let essayService: EssayService;
  let mockEssayRepository: jest.Mocked<EssayRepository>;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EssayService,
        {
          provide: EssayRepository,
          useValue: {
            saveEssay: jest.fn(),
            findEssayById: jest.fn(),
            findCategoryById: jest.fn(),
            saveReviewRequest: jest.fn(),
            findReviewByEssayId: jest.fn(),
            updateEssay: jest.fn(),
            findEssays: jest.fn(),
            deleteEssay: jest.fn(),
          },
        },
        {
          provide: UserRepository,
          useValue: {
            findUserById: jest.fn(),
          },
        },
      ],
    }).compile();

    essayService = module.get<EssayService>(EssayService);
    mockEssayRepository = module.get(EssayRepository);
    mockUserRepository = module.get(UserRepository);
  });

  describe('saveEssay', () => {
    it('요청 데이터에 카테고리 아이디가 있지만 찾을 수 없다면', async () => {
      const user = { id: 1, banned: false };
      const data = { id: 1, title: 'New Essay', categoryId: 10 };
      mockEssayRepository.findCategoryById.mockResolvedValue(null);

      await expect(essayService.saveEssay(user as any, 'web', data as any)).rejects.toThrow(
        new HttpException('Category not found.', HttpStatus.BAD_REQUEST),
      );
    });

    it('밴 유저의 경우 발행 및 링크드아웃 요청시 리뷰 생성', async () => {
      const user = new User();
      const data = new CreateEssayReqDto();
      const savedBannedEssay = new Essay();

      user.id = 1;
      user.banned = true;
      data.title = 'New Essay';
      data.content = 'New Essay content';
      data.published = true;
      savedBannedEssay.id = 1;
      savedBannedEssay.published = false;

      mockUserRepository.findUserById.mockResolvedValue(user);
      mockEssayRepository.saveEssay.mockResolvedValue(savedBannedEssay);

      const result = await essayService.saveEssay(user, 'web', data);
      expect(mockEssayRepository.saveReviewRequest).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Your essay is under review due to policy violations.' });
    });

    it('일반 유저는 그냥 저장', async () => {
      const user = new User();
      const data = { id: 1, title: 'New Essay', categoryId: 10, published: true };
      const savedEssay = new Essay();
      const category = new Category();

      user.banned = false;
      savedEssay.published = true;
      mockUserRepository.findUserById.mockResolvedValue(user);
      mockEssayRepository.findCategoryById.mockResolvedValue(category);
      mockEssayRepository.saveEssay.mockResolvedValue(savedEssay);

      const result = await essayService.saveEssay(user as any, 'web', data as any);

      expect(result.published).toEqual(true);
    });
  });

  describe('updateEssay', () => {
    it('에세이를 찾을 수 없으면 에러 발생', async () => {
      mockEssayRepository.findEssayById.mockResolvedValue(null);

      await expect(essayService.updateEssay({ id: 1 } as any, 123, {} as any)).rejects.toThrow(
        'Essay not found',
      );
    });

    it('에세이가 검토 중인 경우 에러 발생', async () => {
      const user = { id: 1, banned: false };
      const data = { categoryId: 10, linkedOut: true };
      const essay = new Essay();
      const reviewQueue = new ReviewQueue();
      mockEssayRepository.findEssayById.mockResolvedValue(essay);
      mockEssayRepository.findReviewByEssayId.mockResolvedValue(reviewQueue);

      await expect(essayService.updateEssay(user as any, essay.id, data as any)).rejects.toThrow(
        new HttpException(
          'Update rejected: Essay is currently under review',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('밴 사용자가 발행 또는 링크드아웃으로 수정 요청시', async () => {
      const user = { id: 1, banned: true };
      const data = { categoryId: 10, published: true };
      const essay = new Essay();
      essay.id = 1;
      mockEssayRepository.findEssayById.mockResolvedValue(essay);
      mockEssayRepository.saveReviewRequest.mockResolvedValue();

      const result = await essayService.updateEssay(user as any, essay.id, data as any);

      expect(mockEssayRepository.saveReviewRequest).toHaveBeenCalled();
      expect(result.message).toEqual('Review request created due to policy violations.');
    });
  });

  describe('getMyEssay', () => {
    it('should return essays based on user and filters', async () => {
      const essay = new Essay();
      essay.id = 1;
      essay.title = 'Test Essay';
      const mockEssays = [essay];
      const response = { essays: mockEssays, total: 1, totalPage: 1, page: 1 };
      mockEssayRepository.findEssays.mockResolvedValue(response);

      const result = await essayService.getMyEssay(1, true, 10, 1, 10);

      expect(result.essays.length).toBe(1);
      expect(result.total).toEqual(1);
    });
  });

  describe('deleteEssay', () => {
    it('삭제요청한 에세이가 사용자 소유가 아닌 경우', async () => {
      const user = new User();
      user.id = 2;
      const essay = new Essay();
      essay.id = 1;
      essay.author = user;
      mockEssayRepository.findEssayById.mockResolvedValue(essay);

      await expect(essayService.deleteEssay(1, 1)).rejects.toThrow(
        new HttpException(
          'Essay not found or you do not have permission to delete this essay.',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('저자가 맞다면 삭제', async () => {
      const user = new User();
      user.id = 1;
      const essay = new Essay();
      essay.id = 1;
      essay.author = user;
      mockEssayRepository.findEssayById.mockResolvedValue(essay);

      await expect(essayService.deleteEssay(1, 1)).resolves.toBeUndefined();
      expect(mockEssayRepository.deleteEssay).toHaveBeenCalledWith(essay);
    });
  });
});
